import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ItemType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { getTrashItemsInFolderHierarchy } from "@/lib/api/dataroom/trash-utils";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "DELETE") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const {
      teamId,
      id: dataroomId,
      trashId,
    } = req.query as {
      teamId: string;
      id: string;
      trashId: string;
    };

    if (!trashId) {
      return res.status(400).end("Selected item not found");
    }

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
        return res.status(404).end("Dataroom not found");
      }

      const trashItem = await prisma.trashItem.findFirst({
        where: {
          id: trashId,
          dataroomId: dataroomId,
        },
        select: {
          id: true,
          itemId: true,
          itemType: true,
          dataroomFolderId: true,
          dataroomDocumentId: true,
        },
      });

      if (!trashItem) {
        return res.status(404).json({
          message: "Trash item not found",
        });
      }

      await prisma.$transaction(async (tx) => {
        if (
          trashItem.itemType === ItemType.DATAROOM_FOLDER &&
          trashItem.dataroomFolderId
        ) {
          const trashItemsToDelete = await getTrashItemsInFolderHierarchy(
            trashItem.dataroomFolderId,
            dataroomId,
            tx,
            trashItem,
          );

          for (const item of trashItemsToDelete) {
            if (
              item.itemType === ItemType.DATAROOM_DOCUMENT &&
              item.dataroomDocumentId
            ) {
              await tx.dataroomDocument.delete({
                where: {
                  id: item.dataroomDocumentId,
                  dataroomId: dataroomId,
                },
              });
            } else if (
              item.itemType === ItemType.DATAROOM_FOLDER &&
              item.dataroomFolderId
            ) {
              await tx.dataroomFolder.delete({
                where: {
                  id: item.dataroomFolderId,
                },
              });
            }
            await tx.trashItem.delete({
              where: {
                id: item.id,
                dataroomId: dataroomId,
              },
            });
          }
        } else if (
          trashItem.itemType === ItemType.DATAROOM_DOCUMENT &&
          trashItem.dataroomDocumentId
        ) {
          await tx.dataroomDocument.delete({
            where: {
              id: trashItem.dataroomDocumentId,
              dataroomId: dataroomId,
            },
          });
          await tx.trashItem.delete({
            where: {
              id: trashItem.id,
              dataroomId: dataroomId,
            },
          });
        }
      });

      return res.status(204).end();
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
