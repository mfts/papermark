import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

async function handleMoveDocuments(
  req: AuthenticatedRequest,
  res: NextApiResponse,
): Promise<void> {
  const { teamId } = req.query as { teamId: string };
  const { documentIds, folderId } = req.body as {
    documentIds: string[];
    folderId: string | null;
  };

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
    res.status(404).end("No documents were updated");
    return;
  }

  res.status(200).json({
    message: "Document moved successfully",
    updatedCount: updatedDocuments.count,
    newPath: folder?.path,
  });
}

export default createTeamHandler(
  {
    PATCH: handleMoveDocuments,
  },
  {
    requireManager: true, // Only managers and admins can move documents
  },
);
