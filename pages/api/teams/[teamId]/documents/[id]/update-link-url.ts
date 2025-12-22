import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { get } from "@vercel/edge-config";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";
import { linkUrlUpdateSchema } from "@/lib/zod/url-validation";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = (session.user as CustomUser).id;
  const { teamId, id: documentId } = req.query as {
    teamId: string;
    id: string;
  };
  const { linkUrl } = req.body as { linkUrl: string };

  const validationResult = await linkUrlUpdateSchema.safeParseAsync(linkUrl);
  if (!validationResult.success) {
    return res.status(400).json({ message: validationResult.error.message });
  }

  const validatedUrl = validationResult.data;

  try {
    const teamAccess = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: teamId,
        },
      },
    });
    if (!teamAccess) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        teamId: teamId,
      },
      select: {
        id: true,
        file: true,
        type: true,
        versions: {
          select: { id: true, file: true, type: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.type !== "link") {
      return res
        .status(400)
        .json({ message: "Document is not a link document" });
    }

    if (!document.versions[0]) {
      return res.status(400).json({ message: "Document has no versions" });
    }

    // Check if URL contains blocked keywords
    const keywords = await get("keywords");
    if (Array.isArray(keywords) && keywords.length > 0) {
      const matchedKeyword = keywords.find(
        (keyword) =>
          typeof keyword === "string" && validatedUrl.includes(keyword),
      );

      if (matchedKeyword) {
        log({
          message: `Link URL update blocked: ${matchedKeyword} \n\n \`Metadata: {teamId: ${teamId}, documentId: ${documentId}, url: ${validatedUrl}}\``,
          type: "error",
          mention: true,
        });
        return res.status(400).json({
          message: "This URL is not allowed",
          matchedKeyword: matchedKeyword,
        });
      }
    }

    // Update document version
    await prisma.document.update({
      where: {
        id: documentId,
        teamId: teamId,
      },
      data: {
        file: validatedUrl.toString(),
        versions: {
          update: {
            where: { id: document.versions[0].id },
            data: { file: validatedUrl.toString() },
          },
        },
      },
    });

    return res.status(200).json({ message: "Link URL updated successfully" });
  } catch (error) {
    console.error("Error updating Link URL:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
