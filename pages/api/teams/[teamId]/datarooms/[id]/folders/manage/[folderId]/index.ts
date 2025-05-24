import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { ItemType } from "@prisma/client";
const TRASH_RETENTION_DAYS = 30;

const calculatePurgeDate = (): Date => {
  const purgeDate = new Date();
  purgeDate.setDate(purgeDate.getDate() + TRASH_RETENTION_DAYS);
  return purgeDate;
};
interface CreateTrashItemInput {
  itemId: string;
  itemType: ItemType;
  dataroomId: string;
  name: string;
  fullPath: string | null;
  userId: string;
  dataroomDocumentId?: string;
  dataroomFolderId?: string;
  trashPath: string | null;
  parentId?: string | null;
}
// Helper function to create trash item
export async function createTrashItem(tx: any, {
  itemId,
  itemType,
  dataroomId,
  name,
  fullPath,
  userId,
  dataroomDocumentId,
  dataroomFolderId,
  trashPath,
  parentId,
}: CreateTrashItemInput) {
  return await tx.trashItem.create({
    data: {
      itemId,
      itemType,
      dataroomId,
      name,
      fullPath,
      parentId,
      deletedBy: userId,
      purgeAt: calculatePurgeDate(),
      trashPath: trashPath,
      ...(dataroomDocumentId && { dataroomDocumentId }),
      ...(dataroomFolderId && { dataroomFolderId }),
    },
  });
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/datarooms/[:id]/folders/manage
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const {
      teamId,
      id: dataroomId,
      folderId,
    } = req.query as {
      teamId: string;
      id: string;
      folderId: string;
    };

    const userId = (session.user as CustomUser).id;

    try {
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
        return res.status(401).end("Unauthorized");
      }

      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: team.id,
        },
      });

      if (!dataroom) {
        return res.status(401).end("Dataroom not found");
      }

      const folder = await prisma.dataroomFolder.findUnique({
        where: {
          id: folderId,
          dataroomId: dataroomId,
          removedAt: null,
        },
        select: {
          id: true,
          name: true,
          path: true,
        },
      });

      if (!folder) {
        return res.status(404).json({
          message: "Folder not found",
        });
      }

      // Delete the folder and its contents recursively within a transaction
      await prisma.$transaction(async (tx) => {
        await softDeleteFolderAndContents(tx, folderId, dataroomId, userId);
      });

      return res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      console.error("Error in DELETE folder:", error);
      return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete folder" });
    }
  } else {
    // We only allow DELETE requests
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function softDeleteFolderAndContents(
  tx: any,
  folderId: string,
  dataroomId: string,
  userId: string,
  parentTrashPath: string | null = null,
  parentFolderId: string | null = null
) {
  const folder = await tx.dataroomFolder.findUnique({
    where: {
      id: folderId,
      removedAt: null,
    },
    select: {
      id: true,
      name: true,
      path: true,
      parentFolder: {
        select: {
          path: true,
        },
      },
    },
  });

  if (!folder) {
    throw new Error("Folder not found");
  }

  const trashPath = parentTrashPath === null ? `/${slugify(folder.name)}` : `${parentTrashPath}/${slugify(folder.name)}`;

  // First, soft delete the folder itself and create its trash item
  await tx.dataroomFolder.update({
    where: {
      id: folderId,
      removedAt: null,
    },
    data: {
      removedAt: new Date(),
    },
  });

  // Create trash item for the folder before processing children
  const folderTrashItem = await createTrashItem(tx, {
    itemId: folder.id,
    itemType: ItemType.DATAROOM_FOLDER,
    dataroomId,
    dataroomFolderId: folder.id,
    name: folder.name,
    fullPath: folder.path,
    userId,
    trashPath: trashPath,
    parentId: parentFolderId
  });

  // Find and soft delete child folders recursively
  const childFolders = await tx.dataroomFolder.findMany({
    where: {
      parentId: folderId,
      removedAt: null,
    },
    select: {
      id: true,
      name: true,
      path: true,
    },
  });

  for (const childFolder of childFolders) {
    await softDeleteFolderAndContents(tx, childFolder.id, dataroomId, userId, trashPath, folder.id);
  }

  // Find and soft delete documents in this folder
  const documents = await tx.dataroomDocument.findMany({
    where: {
      folderId: folderId,
      removedAt: null,
    },
    select: {
      id: true,
      document: {
        select: {
          id: true,
          name: true,
        },
      },
      folder: {
        select: {
          path: true,
        },
      },
    },
  });

  // Soft delete each document and create trash items with current trash path
  for (const doc of documents) {
    await tx.dataroomDocument.update({
      where: {
        id: doc.id,
        removedAt: null,
      },
      data: {
        removedAt: new Date(),
      },
    });

    await createTrashItem(tx, {
      itemId: doc.id,
      itemType: ItemType.DATAROOM_DOCUMENT,
      dataroomId,
      dataroomDocumentId: doc.id,
      name: doc.document.name,
      fullPath: doc.folder?.path,
      userId,
      trashPath: trashPath,
      parentId: folder.id
    });
  }

  return folderTrashItem;
}
