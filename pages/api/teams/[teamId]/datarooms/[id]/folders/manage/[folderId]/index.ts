import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

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
        },
      });

      if (!folder) {
        return res.status(404).json({
          message: "Folder not found",
        });
      }

      // Delete the folder and its contents recursively
      await deleteFolderAndContents(folderId);

      return res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow DELETE requests
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

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
