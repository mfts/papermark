import { NextApiRequest, NextApiResponse } from "next";

import { waitUntil } from "@vercel/functions";

import { hashToken } from "@/lib/api/auth/token";
import { createDocument } from "@/lib/documents/create-document";
import { putFileServer } from "@/lib/files/put-file-server";
import { extractTeamId, isValidWebhookId } from "@/lib/incoming-webhooks";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { getSupportedContentType } from "@/lib/utils/get-content-type";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
  maxDuration: 60,
};

export default async function incomingWebhookHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the full webhook ID from the path
  const { path } = req.query;
  const webhookId = Array.isArray(path) ? path.join("/") : path;

  if (!webhookId || !isValidWebhookId(webhookId)) {
    return res.status(400).json({ error: "Invalid webhook format" });
  }

  // Check for API token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");
  const hashedToken = hashToken(token);

  // Look up token in database
  const restrictedToken = await prisma.restrictedToken.findUnique({
    where: { hashedKey: hashedToken },
    select: { teamId: true, rateLimit: true },
  });

  if (!restrictedToken) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Rate limit checks for API tokens
  const rateLimit = restrictedToken.rateLimit || 60; // Default rate limit of 60 requests per minute

  const { success, limit, reset, remaining } = await ratelimit(
    rateLimit,
    "1 m",
  ).limit(hashedToken);

  // Set rate limit headers
  res.setHeader("Retry-After", reset.toString());
  res.setHeader("X-RateLimit-Limit", limit.toString());
  res.setHeader("X-RateLimit-Remaining", remaining.toString());
  res.setHeader("X-RateLimit-Reset", reset.toString());

  if (!success) {
    return res.status(429).json({ error: "Too many requests" });
  }

  // Update last used timestamp for the token
  waitUntil(
    prisma.restrictedToken.update({
      where: {
        hashedKey: hashedToken,
      },
      data: {
        lastUsed: new Date(),
      },
    }),
  );

  const teamId = extractTeamId(webhookId);
  if (!teamId) {
    return res.status(400).json({ error: "Invalid team ID in webhook" });
  }

  if (restrictedToken.teamId !== teamId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1. Find the webhook integration
    const incomingWebhook = await prisma.incomingWebhook.findUnique({
      where: {
        externalId: webhookId,
        teamId: teamId,
      },
      include: { team: true },
    });

    if (!incomingWebhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    // 3. Validate request body
    const { fileUrl, name, contentType, dataroomId } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ error: "File URL is required" });
    }

    if (dataroomId) {
      // Verify dataroom exists and belongs to team
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: incomingWebhook.teamId,
        },
      });

      if (!dataroom) {
        return res.status(400).json({ error: "Invalid dataroom ID" });
      }
    }

    // Check if the content type is supported
    const supportedContentType = getSupportedContentType(contentType);
    if (!supportedContentType) {
      return res.status(400).json({ error: "Unsupported content type" });
    }

    // 4. Fetch file from URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return res.status(400).json({ error: "Failed to fetch file from URL" });
    }

    // 5. Convert to buffer
    const fileBuffer = Buffer.from(await response.arrayBuffer());

    console.log(
      "Uploading file to storage",
      incomingWebhook.teamId,
      name,
      contentType,
    );

    // Upload the file to storage
    const { type: storageType, data } = await putFileServer({
      file: {
        name: name,
        type: contentType,
        buffer: fileBuffer,
      },
      teamId: incomingWebhook.teamId,
      restricted: false, // allows all supported file types
    });

    if (!data || !storageType) {
      return res.status(500).json({ error: "Failed to save file to storage" });
    }

    // 6. Create document using our service
    const documentCreationResponse = await createDocument({
      documentData: {
        name: name,
        key: data,
        storageType: storageType,
        contentType: contentType,
        supportedFileType: supportedContentType,
        fileSize: fileBuffer.byteLength,
      },
      teamId: incomingWebhook.teamId,
      numPages: 1,
      token: token,
    });

    if (!documentCreationResponse.ok) {
      return res.status(500).json({ error: "Failed to create document" });
    }

    const document = await documentCreationResponse.json();

    // If dataroomId was provided, create the relationship
    if (dataroomId) {
      await prisma.dataroomDocument.create({
        data: {
          dataroomId,
          documentId: document.id,
        },
      });
    }

    return res.status(200).json({
      message: `Document created successfully${
        dataroomId ? ` and added to dataroom` : ""
      }`,
      documentId: document.id,
      dataroomId: dataroomId ?? undefined,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
