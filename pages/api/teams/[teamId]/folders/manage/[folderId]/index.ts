import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import { deleteFile } from "@/lib/files/delete-file-server";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, folderId } = req.query as {
      teamId: string;
      folderId: string;
    };

    try {
      const folder = await prisma.folder.findUnique({
        where: {
          id: folderId,
        },
        select: {
          _count: {
            select: {
              documents: true,
              childFolders: true,
            },
          },
        },
      });

      if (!folder) {
        res.status(404).json({
          message: "Folder not found",
        });
        return;
      }

      // Delete the folder and its contents
      await deleteFolderAndContents(folderId, teamId);

      res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      errorhandler(error, res);
    }
  },
});

async function deleteFolderAndContents(folderId: string, teamId: string) {
  const childFoldersToDelete = await prisma.folder.findMany({
    where: {
      parentId: folderId,
    },
  });

  for (const childFolder of childFoldersToDelete) {
    await deleteFolderAndContents(childFolder.id, teamId);
  }

  // Delete all documents in the folder
  const documents = await prisma.document.findMany({
    where: {
      folderId: folderId,
      type: {
        not: "notion",
      },
    },
    include: {
      versions: {
        select: {
          id: true,
          file: true,
          type: true,
          storageType: true,
        },
      },
    },
  });

  documents.map(async (documentVersions: { versions: any }) => {
    for (const version of documentVersions.versions) {
      await deleteFile({
        type: version.storageType,
        data: version.file,
        teamId,
      });
    }
  });

  await prisma.document.deleteMany({
    where: {
      folderId: folderId,
    },
  });

  // Delete the folder itself
  await prisma.folder.delete({
    where: {
      id: folderId,
    },
  });
}
