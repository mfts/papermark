import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

async function deleteFolderAndContents(folderId: string) {
  const childFoldersToDelete = await prisma.dataroomFolder.findMany({
    where: {
      parentId: folderId,
    },
  });

  console.log("Deleting folder and contents", childFoldersToDelete);

  for (const folder of childFoldersToDelete) {
    await deleteFolderAndContents(folder.id);
  }

  await prisma.dataroomDocument.deleteMany({
    where: {
      folderId: folderId,
    },
  });

  await prisma.dataroomFolder.delete({
    where: {
      id: folderId,
    },
  });
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // DELETE /api/teams/:teamId/datarooms/[:id]/folders/manage
  const {
    teamId,
    id: dataroomId,
    folderId,
  } = req.query as {
    teamId: string;
    id: string;
    folderId: string;
  };

  try {
    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: dataroomId,
        teamId: teamId,
      },
    });

    if (!dataroom) {
      res.status(404).end("Dataroom not found");
      return;
    }

    const folder = await prisma.dataroomFolder.findUnique({
      where: {
        id: folderId,
        dataroomId: dataroomId,
      },
    });

    if (!folder) {
      res.status(404).json({
        message: "Folder not found",
      });
      return;
    }

    // Delete the folder and its contents recursively
    await deleteFolderAndContents(folderId);

    res.status(204).end(); // 204 No Content response for successful deletes
  } catch (error) {
    errorhandler(error, res);
  }
}

export default createTeamHandler({
  DELETE: handler,
});
