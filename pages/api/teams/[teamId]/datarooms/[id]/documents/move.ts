import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // PATCH /api/teams/:teamId/datarooms/:id/documents/move
  const { teamId, id: dataroomId } = req.query as {
    teamId: string;
    id: string;
  };
  const { documentIds, folderId } = req.body as {
    documentIds: string[];
    folderId: string | null;
  };

  // Ensure the user is an admin of the team
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      datarooms: {
        where: { id: dataroomId },
      },
      users: {
        where: {
          role: { in: ["ADMIN", "MANAGER"] },
          userId: req.user.id,
        },
      },
    },
  });

  if (!team || team.users.length === 0 || team.datarooms.length === 0) {
    res.status(403).end("Forbidden");
    return;
  }

  // Update the folderId for the specified documents
  const updatedDocuments = await prisma.dataroomDocument.updateMany({
    where: {
      id: { in: documentIds },
      dataroomId: dataroomId,
    },
    data: {
      folderId: folderId,
      orderIndex: null,
    },
  });

  // Get new path for folder unless folderId is null
  let folder: { path: string } | null = null;
  if (folderId) {
    folder = await prisma.dataroomFolder.findUnique({
      where: { id: folderId, dataroomId: dataroomId },
      select: { path: true },
    });
  }

  if (updatedDocuments.count === 0) {
    res.status(404).end("No documents were updated");
    return;
  }

  console.log("Documents moved successfully", updatedDocuments.count);

  res.status(200).json({
    message: "Document moved successfully",
    updatedCount: updatedDocuments.count,
    newPath: folder?.path,
  });
}

export default createTeamHandler(
  {
    PATCH: handler,
  },
  {
    requireManager: true,
  },
);
