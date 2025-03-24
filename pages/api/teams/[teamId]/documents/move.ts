import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/documents/move
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }
    const userId = (session.user as CustomUser).id;
    const { teamId } = req.query as { teamId: string };
    const { documentIds, folderId } = req.body as {
      documentIds: string[];
      folderId: string | null;
    };

    // Ensure the user is an admin of the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        users: {
          where: {
            userId: userId,
          },
        },
      },
    });

    if (!team || team.users.length === 0) {
      return res.status(403).end("Forbidden");
    }

    // Update the folderId for the specified documents
    const updatedDocuments = await prisma.document.updateMany({
      where: {
        id: { in: documentIds },
        teamId: teamId,
      },
      data: {
        folderId: folderId,
      },
    });

    // Get new path for folder unless folderId is null
    let folder: { path: string } | null = null;
    if (folderId) {
      folder = await prisma.folder.findUnique({
        where: { id: folderId, teamId: teamId },
        select: { path: true },
      });
    }

    if (updatedDocuments.count === 0) {
      return res.status(404).end("No documents were updated");
    }

    return res.status(200).json({
      message: "Document moved successfully",
      updatedCount: updatedDocuments.count,
      newPath: folder?.path,
    });
  } else {
    // We only allow PATCH requests
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
