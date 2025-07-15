import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

async function patchHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // PATCH /api/teams/:teamId/datarooms/:id/documents/:documentId
  const {
    id: dataroomId,
    documentId,
  } = req.query as { id: string; documentId: string };
  const { folderId, currentPathName } = req.body as {
    folderId: string;
    currentPathName: string;
  };

  try {
    // Ensure the dataroom belongs to the team
    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: dataroomId,
        teamId: req.team.id,
      },
    });

    if (!dataroom) {
      res.status(404).end("Dataroom not found");
      return;
    }

    const document = await prisma.dataroomDocument.update({
      where: {
        id: documentId,
        dataroomId: dataroomId,
      },
      data: {
        folderId: folderId,
      },
      select: {
        folder: {
          select: {
            path: true,
          },
        },
      },
    });

    if (!document) {
      res.status(404).end("Document not found");
      return;
    }

    res.status(200).json({
      message: "Document moved successfully",
      newPath: document.folder?.path,
      oldPath: currentPathName,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to move document" });
  }
}

async function deleteHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // DELETE /api/teams/:teamId/datarooms/:id/documents/:documentId
  const {
    id: dataroomId,
    documentId,
  } = req.query as { id: string; documentId: string };

  try {
    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: dataroomId,
        teamId: req.team.id,
      },
    });

    if (!dataroom) {
      res.status(404).end("Dataroom not found");
      return;
    }

    const document = await prisma.dataroomDocument.delete({
      where: {
        id: documentId,
        dataroomId: dataroomId,
      },
    });

    if (!document) {
      res.status(404).end("Document not found");
      return;
    }

    res.status(204).end(); // No Content
  } catch (error) {
    res.status(500).json({ error: "Failed to delete document" });
  }
}

export default createTeamHandler({
  PATCH: patchHandler,
  DELETE: deleteHandler,
});
