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
  const { darkMode } = req.body as { darkMode: boolean };

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
      },
      select: {
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

    const notionUrl = new URL(documentVersion.file);
    if (darkMode) {
      notionUrl.searchParams.set("mode", "dark");
    } else {
      notionUrl.searchParams.delete("mode");
    }

    // Update document version
    await prisma.documentVersion.updateMany({
      where: {
        documentId: documentId,
      },
      data: {
        file: notionUrl.toString(),
      },
    });

    await fetch(
      `${process.env.NEXTAUTH_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&documentId=${documentId}`,
    );

    return res.status(200).json({
      message: `Notion document theme changed to ${darkMode ? "dark" : "light"} mode`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating document" });
  }
}
