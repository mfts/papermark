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
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { teamId, folderId } = req.query as {
      teamId: string;
      folderId: string;
    };

    const userId = (session.user as CustomUser).id;

    try {
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: teamId,
          },
        },
        select: {
          role: true,
        },
      });

      if (!teamAccess) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (teamAccess.role !== "ADMIN" && teamAccess.role !== "MANAGER") {
        return res.status(403).json({
          message:
            "You are not permitted to perform this action. Only admin and managers can delete folders.",
        });
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

      if (!folder) {
        return res.status(404).json({
          message: "Folder not found",
        });
      }

      // Delete the folder and its contents
      await deleteFolderAndContents(folderId, teamId);

      return res.status(204).end(); // 204 No Content response for successful deletes
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow DELETE requests
    res.setHeader("Allow", ["DELETE"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }
}

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
