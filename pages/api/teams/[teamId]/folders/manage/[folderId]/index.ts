import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { deleteFile } from "@/lib/files/delete-file-server";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/folders/manage/:folderId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId, folderId } = req.query as {
      teamId: string;
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

      const deleteDocuments = async () => {
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
            await deleteFile({ type: version.storageType, data: version.file });
          }
        });

        await prisma.document.deleteMany({
          where: {
            folderId: folderId,
          },
        });
      };

      const deleteFolderWithChildren = async (folderId: string) => {
        const children = await prisma.folder.findMany({
          where: {
            parentId: folderId,
          },
        });

        for (const child of children) {
          await deleteFolderWithChildren(child.id);
        }

        await deleteDocuments();

        await prisma.folder.delete({
          where: {
            id: folderId,
          },
        });
      };

      if (folder?._count.documents! > 0 || folder?._count.childFolders! > 0) {
        await deleteFolderWithChildren(folderId);

        return res.status(204).end();
      }

      await prisma.folder.delete({
        where: {
          id: folderId,
        },
      });

      return res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET, PUT and DELETE requests
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
