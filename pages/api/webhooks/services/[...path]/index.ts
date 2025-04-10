import { NextApiRequest, NextApiResponse } from "next";

import { waitUntil } from "@vercel/functions";
import { z } from "zod";

import { hashToken } from "@/lib/api/auth/token";
import { createDocument } from "@/lib/documents/create-document";
import { putFileServer } from "@/lib/files/put-file-server";
import { extractTeamId, isValidWebhookId } from "@/lib/incoming-webhooks";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { generateEncrpytedPassword } from "@/lib/utils";
import { getSupportedContentType } from "@/lib/utils/get-content-type";
import { sendLinkCreatedWebhook } from "@/lib/webhook/triggers/link-created";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
  maxDuration: 120,
};

// Define a common link schema to reuse
const LinkSchema = z.object({
  name: z.string().optional(),
  domain: z.string().optional(),
  slug: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.string().optional(), // ISO string date
  emailProtected: z.boolean().optional(),
  emailAuthenticated: z.boolean().optional(),
  allowDownload: z.boolean().optional(),
  enableNotification: z.boolean().optional(),
  enableFeedback: z.boolean().optional(),
  enableScreenshotProtection: z.boolean().optional(),
  audienceType: z.enum(["GENERAL", "GROUP", "TEAM"]).optional(),
  groupId: z.string().optional(),
  allowList: z.array(z.string()).optional(),
});

// Define validation schemas for different resource types
const BaseSchema = z.object({
  resourceType: z.enum(["document.create", "link.create", "dataroom.create"]),
});

const DocumentCreateSchema = BaseSchema.extend({
  resourceType: z.literal("document.create"),
  fileUrl: z.string().url(),
  name: z.string(),
  contentType: z.string(),
  dataroomId: z.string().optional(),
  createLink: z.boolean().optional().default(false),
  link: LinkSchema.optional(),
});

const LinkCreateSchema = BaseSchema.extend({
  resourceType: z.literal("link.create"),
  targetId: z.string(),
  linkType: z.enum(["DOCUMENT_LINK", "DATAROOM_LINK"]),
  link: LinkSchema,
});

const DataroomCreateSchema = BaseSchema.extend({
  resourceType: z.literal("dataroom.create"),
  name: z.string(),
  description: z.string().optional(),
  createLink: z.boolean().optional().default(false),
  link: LinkSchema.optional(),
});

const RequestBodySchema = z.discriminatedUnion("resourceType", [
  DocumentCreateSchema,
  LinkCreateSchema,
  DataroomCreateSchema,
]);

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

    // Validate request body against the schema
    const validationResult = RequestBodySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: validationResult.error.format(),
      });
    }

    const validatedData = validationResult.data;

    // Handle different resource types
    if (validatedData.resourceType === "document.create") {
      return await handleDocumentCreate(
        validatedData,
        incomingWebhook.teamId,
        token,
        res,
      );
    } else if (validatedData.resourceType === "link.create") {
      return await handleLinkCreate(
        validatedData,
        incomingWebhook.teamId,
        token,
        res,
      );
    } else if (validatedData.resourceType === "dataroom.create") {
      return await handleDataroomCreate(
        validatedData,
        incomingWebhook.teamId,
        token,
        res,
      );
    }

    // This shouldn't be reached due to the validation schema, but just in case
    return res.status(400).json({ error: "Invalid resource type" });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle document.create resource type
 */
async function handleDocumentCreate(
  data: z.infer<typeof DocumentCreateSchema>,
  teamId: string,
  token: string,
  res: NextApiResponse,
) {
  const { fileUrl, name, contentType, dataroomId, createLink, link } = data;

  // Check if the content type is supported
  const supportedContentType = getSupportedContentType(contentType);
  if (!supportedContentType) {
    return res.status(400).json({ error: "Unsupported content type" });
  }

  if (dataroomId) {
    // Verify dataroom exists and belongs to team
    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: dataroomId,
        teamId: teamId,
      },
    });

    if (!dataroom) {
      return res.status(400).json({ error: "Invalid dataroom ID" });
    }
  }

  // If custom domain and slug are provided, validate them
  if (createLink && link?.domain && link?.slug) {
    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: {
        slug: link.domain,
        teamId: teamId,
      },
    });

    if (!domain) {
      return res
        .status(400)
        .json({ error: "Domain not found or not associated with this team" });
    }

    // Check if the slug is already in use with this domain
    const existingLink = await prisma.link.findUnique({
      where: {
        domainSlug_slug: {
          slug: link.slug,
          domainSlug: link.domain,
        },
      },
    });

    if (existingLink) {
      return res
        .status(400)
        .json({ error: "The link with this domain and slug already exists" });
    }
  }

  // 4. Fetch file from URL
  const response = await fetch(fileUrl);
  if (!response.ok) {
    return res.status(400).json({ error: "Failed to fetch file from URL" });
  }

  // 5. Convert to buffer
  const fileBuffer = Buffer.from(await response.arrayBuffer());

  console.log("Uploading file to storage", teamId, name, contentType);

  // Upload the file to storage
  const { type: storageType, data: fileData } = await putFileServer({
    file: {
      name: name,
      type: contentType,
      buffer: fileBuffer,
    },
    teamId: teamId,
    restricted: false, // allows all supported file types
  });

  if (!fileData || !storageType) {
    return res.status(500).json({ error: "Failed to save file to storage" });
  }

  // 6. Create document using our service
  // Note: The createDocument function doesn't accept linkData in its parameters
  // so we will just pass createLink flag
  const documentCreationResponse = await createDocument({
    documentData: {
      name: name,
      key: fileData,
      storageType: storageType,
      contentType: contentType,
      supportedFileType: supportedContentType,
      fileSize: fileBuffer.byteLength,
    },
    teamId: teamId,
    numPages: 1,
    token: token,
    createLink: createLink, // INFO: creatLink=true will not trigger a link.created webhook
  });

  if (!documentCreationResponse.ok) {
    return res.status(500).json({ error: "Failed to create document" });
  }

  const document = await documentCreationResponse.json();
  let newLink: any;

  // If we need to customize the link, update it after creation
  if (createLink && document.links && document.links.length > 0 && link) {
    const linkId = document.links[0].id;

    // Process fields for link update
    const hashedPassword = link.password
      ? await generateEncrpytedPassword(link.password)
      : null;

    const expiresAtDate = link.expiresAt ? new Date(link.expiresAt) : null;
    const isGroupAudience = link.audienceType === "GROUP";

    let domainId = null;
    if (link.domain) {
      const domain = await prisma.domain.findUnique({
        where: {
          slug: link.domain,
          teamId: teamId,
        },
        select: { id: true },
      });
      domainId = domain?.id || null;
    }

    // Update the link with custom settings
    newLink = await prisma.link.update({
      where: { id: linkId, teamId: teamId },
      data: {
        name: link.name,
        password: hashedPassword,
        expiresAt: expiresAtDate,
        domainId: domainId,
        domainSlug: link.domain || null,
        slug: link.slug || null,
        emailProtected: link.emailProtected,
        emailAuthenticated: link.emailAuthenticated,
        allowDownload: link.allowDownload,
        enableNotification: link.enableNotification,
        enableFeedback: link.enableFeedback,
        enableScreenshotProtection: link.enableScreenshotProtection,
        audienceType: link.audienceType,
        groupId: isGroupAudience ? link.groupId : null,
        allowList: link.allowList,
      },
    });

    waitUntil(
      sendLinkCreatedWebhook({
        teamId,
        data: {
          document_id: document.id,
          link_id: newLink.id,
        },
      }),
    );
  }

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
    linkId: newLink?.id ?? undefined,
    linkUrl: createLink
      ? newLink?.domainSlug && newLink?.slug
        ? `https://${newLink.domainSlug}/${newLink.slug}`
        : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${newLink?.id}`
      : undefined,
  });
}

/**
 * Handle link.create resource type
 */
async function handleLinkCreate(
  data: z.infer<typeof LinkCreateSchema>,
  teamId: string,
  token: string,
  res: NextApiResponse,
) {
  const { targetId, linkType, link } = data;

  // Validate target exists and belongs to the team
  if (linkType === "DOCUMENT_LINK") {
    const document = await prisma.document.findUnique({
      where: {
        id: targetId,
        teamId: teamId,
      },
    });

    if (!document) {
      return res
        .status(400)
        .json({ error: "Document not found or not associated with this team" });
    }
  } else if (linkType === "DATAROOM_LINK") {
    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: targetId,
        teamId: teamId,
      },
    });

    if (!dataroom) {
      return res
        .status(400)
        .json({ error: "Dataroom not found or not associated with this team" });
    }
  }

  // If domain and slug are provided, validate them
  let domainId = null;
  if (link.domain && link.slug) {
    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: {
        slug: link.domain,
        teamId: teamId,
      },
      select: { id: true },
    });

    if (!domain) {
      return res
        .status(400)
        .json({ error: "Domain not found or not associated with this team" });
    }

    domainId = domain.id;

    // Check if the slug is already in use with this domain
    const existingLink = await prisma.link.findUnique({
      where: {
        domainSlug_slug: {
          slug: link.slug,
          domainSlug: link.domain,
        },
      },
    });

    if (existingLink) {
      return res
        .status(400)
        .json({ error: "The link with this domain and slug already exists" });
    }
  }

  // Create the link
  try {
    // Hash password if provided
    const hashedPassword = link.password
      ? await generateEncrpytedPassword(link.password)
      : null;

    const expiresAtDate = link.expiresAt ? new Date(link.expiresAt) : null;

    const isGroupAudience = link.audienceType === "GROUP";

    const newLink = await prisma.link.create({
      data: {
        documentId: linkType === "DOCUMENT_LINK" ? targetId : null,
        dataroomId: linkType === "DATAROOM_LINK" ? targetId : null,
        linkType,
        teamId,
        name: link.name,
        password: hashedPassword,
        domainId: domainId,
        domainSlug: link.domain || null,
        slug: link.slug || null,
        expiresAt: expiresAtDate,
        emailProtected: link.emailProtected,
        emailAuthenticated: link.emailAuthenticated,
        allowDownload: link.allowDownload,
        enableNotification: link.enableNotification,
        enableFeedback: link.enableFeedback,
        enableScreenshotProtection: link.enableScreenshotProtection,
        audienceType: link.audienceType,
        groupId: isGroupAudience ? link.groupId : null,
        allowList: link.allowList,
      },
    });

    waitUntil(
      sendLinkCreatedWebhook({
        teamId,
        data: {
          document_id: linkType === "DOCUMENT_LINK" ? targetId : null,
          dataroom_id: linkType === "DATAROOM_LINK" ? targetId : null,
          link_id: newLink.id,
        },
      }),
    );

    return res.status(200).json({
      message: "Link created successfully",
      linkId: newLink.id,
      targetId,
      linkType,
      linkUrl:
        domainId && link.domain && link.slug
          ? `https://${newLink.domainSlug}/${newLink.slug}`
          : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${newLink.id}`,
    });
  } catch (error) {
    console.error("Link creation error:", error);
    return res.status(500).json({ error: "Failed to create link" });
  }
}

/**
 * Handle dataroom.create resource type
 */
async function handleDataroomCreate(
  data: z.infer<typeof DataroomCreateSchema>,
  teamId: string,
  token: string,
  res: NextApiResponse,
) {
  const { name, description, createLink, link } = data;

  // If custom domain and slug are provided for link, validate them
  let domainId = null;
  if (createLink && link?.domain && link?.slug) {
    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: {
        slug: link.domain,
        teamId: teamId,
      },
    });

    if (!domain) {
      return res
        .status(400)
        .json({ error: "Domain not found or not associated with this team" });
    }

    domainId = domain.id;

    // Check if the slug is already in use with this domain
    const existingLink = await prisma.link.findUnique({
      where: {
        domainSlug_slug: {
          slug: link.slug,
          domainSlug: link.domain,
        },
      },
    });

    if (existingLink) {
      return res
        .status(400)
        .json({ error: "The link with this domain and slug already exists" });
    }
  }

  // Create the dataroom
  try {
    // Create dataroom with link if requested
    let createData: any = {
      name,
      description,
      teamId,
    };

    if (createLink && link) {
      const isGroupAudience = link.audienceType === "GROUP";
      const hashedPassword = link.password
        ? await generateEncrpytedPassword(link.password)
        : null;
      const expiresAtDate = link.expiresAt ? new Date(link.expiresAt) : null;

      createData.links = {
        create: {
          name: link.name,
          teamId,
          linkType: "DATAROOM_LINK",
          domainId: domainId,
          domainSlug: link.domain || null,
          slug: link.slug || null,
          password: hashedPassword,
          expiresAt: expiresAtDate,
          emailProtected: link.emailProtected,
          emailAuthenticated: link.emailAuthenticated,
          allowDownload: link.allowDownload,
          enableNotification: link.enableNotification,
          enableFeedback: link.enableFeedback,
          enableScreenshotProtection: link.enableScreenshotProtection,
          audienceType: link.audienceType,
          groupId: isGroupAudience ? link.groupId : null,
          allowList: link.allowList,
        },
      };
    }

    const dataroom = await prisma.dataroom.create({
      data: createData,
      include: {
        links: createLink, // Only include links if we're creating one
      },
    });

    if (createLink) {
      waitUntil(
        sendLinkCreatedWebhook({
          teamId,
          data: {
            dataroom_id: dataroom.id,
            link_id: dataroom.links?.[0]?.id,
          },
        }),
      );
    }

    return res.status(200).json({
      message: "Dataroom created successfully",
      dataroomId: dataroom.id,
      linkId: createLink ? dataroom.links?.[0]?.id : undefined,
      linkUrl: createLink
        ? dataroom.links?.[0]?.domainSlug && dataroom.links?.[0]?.slug
          ? `https://${dataroom.links?.[0]?.domainSlug}/${dataroom.links?.[0]?.slug}`
          : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${dataroom.links?.[0]?.id}`
        : undefined,
    });
  } catch (error) {
    console.error("Dataroom creation error:", error);
    return res.status(500).json({ error: "Failed to create dataroom" });
  }
}
