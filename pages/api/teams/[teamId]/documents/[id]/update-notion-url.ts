import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

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
  const { notionUrl } = req.body as { notionUrl: string };

  // Basic URL validation
  if (!notionUrl || typeof notionUrl !== "string") {
    return res.status(400).json({ message: "Valid Notion URL is required" });
  }

  // Validate that it's a Notion URL
  try {
    const url = new URL(notionUrl);
    if (!url.hostname.includes("notion.")) {
      return res.status(400).json({ message: "Invalid Notion URL" });
    }
  } catch (error) {
    return res.status(400).json({ message: "Invalid URL format" });
  }

  try {
    // Check if user has access to the team
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (!team) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const documentVersion = await prisma.documentVersion.findFirst({
      where: {
        documentId: documentId,
        isPrimary: true,
      },
      select: {
        id: true,
        file: true,
        type: true,
      },
    });

    if (!documentVersion) {
      return res.status(404).json({ message: "Document version not found" });
    }

    if (documentVersion.type !== "notion") {
      return res
        .status(400)
        .json({ message: "Document is not a Notion document" });
    }

    // Preserve any existing query parameters from the old URL (like dark mode)
    const oldUrl = new URL(documentVersion.file);
    const newUrl = new URL(notionUrl);
    
    // Copy over the mode parameter if it exists
    const mode = oldUrl.searchParams.get("mode");
    if (mode) {
      newUrl.searchParams.set("mode", mode);
    }

    // Update document version
    await prisma.documentVersion.updateMany({
      where: {
        documentId: documentId,
        isPrimary: true,
      },
      data: {
        file: newUrl.toString(),
      },
    });

    return res.status(200).json({ 
      message: "Notion URL updated successfully",
      newUrl: newUrl.toString(),
    });
  } catch (error) {
    console.error("Error updating Notion URL:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}