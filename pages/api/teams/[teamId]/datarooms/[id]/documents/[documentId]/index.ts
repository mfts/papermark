import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { createTrashItem } from "@/lib/dataroom/trash";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { ItemType } from "@prisma/client";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/datarooms/:id/documents/:documentId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }
    const userId = (session.user as CustomUser).id;
    const {
      teamId,
      id: dataroomId,
      documentId,
    } = req.query as { teamId: string; id: string; documentId: string };
    const { folderId, currentPathName } = req.body as {
      folderId: string;
      currentPathName: string;
    };

    try {
      // Check if the user is part of the team
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

      const document = await prisma.dataroomDocument.update({
        where: {
          id: documentId,
          dataroomId: dataroomId,
          removedAt: null,
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
        return res.status(404).end("Document not found");
      }

      return res.status(200).json({
        message: "Document moved successfully",
        newPath: document.folder?.path,
        oldPath: currentPathName,
      });
    } catch (error) {
      console.error("Error in PATCH /api/teams/:teamId/datarooms/:id/documents/:documentId:", error);
      return res.status(500).json({ error: "Failed to move document" });
    }
  } else if (req.method === "DELETE") {
    /// DELETE /api/teams/:teamId/datarooms/:id/documents/:documentId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;
    const {
      teamId,
      id: dataroomId,
      documentId,
    } = req.query as { teamId: string; id: string; documentId: string };

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

      await prisma.$transaction(async (tx) => {
        const updatedDocument = await tx.dataroomDocument.update({
          where: {
            id: documentId,
            dataroomId: dataroomId,
            removedAt: null,
          },
          data: {
            removedAt: new Date(),
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
        if (!updatedDocument) {
          throw new Error("Document not found in this dataroom");
        }

        await createTrashItem(tx, {
          itemId: updatedDocument.id,
          itemType: ItemType.DATAROOM_DOCUMENT,
          dataroomId,
          dataroomDocumentId: updatedDocument.id,
          name: updatedDocument.document.name,
          fullPath: updatedDocument.folder?.path ?? null,
          userId,
          trashPath: null,
          parentId: null,
        });
      });

      return res.status(204).end(); // No Content
    } catch (error) {
      console.error("Error in DELETE /api/teams/:teamId/datarooms/:id/documents/:documentId:", error);
      return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete document" });
    }
  } else {
    // We only allow PATCH and DELETE requests
    res.setHeader("Allow", ["PATCH", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
