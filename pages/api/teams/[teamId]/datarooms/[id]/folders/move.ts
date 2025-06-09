import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PATCH") {
    // PATCH /api/teams/:teamId/datarooms/:id/folders/move
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }
    const userId = (session.user as CustomUser).id;
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const { selectedFolder, folderIds, selectedFolderPath } = req.body as {
      folderIds: string[];
      selectedFolder: string | null;
      selectedFolderPath: string;
    };

    // Ensure the user is an admin of the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        datarooms: {
          where: { id: dataroomId },
        },
        users: {
          where: {
            role: { in: ["ADMIN", "MANAGER"] },
            userId: userId,
          },
        },
      },
    });

    if (!team || team.users.length === 0 || team.datarooms.length === 0) {
      return res.status(403).end("Forbidden");
    }

    try {
      let updatedFolders: any[] = [];
      await prisma.$transaction(async (prisma) => {
        const foldersToMove = await prisma.dataroomFolder.findMany({
          where: {
            id: { in: folderIds },
            dataroomId: dataroomId,
            removedAt: null,
          },
        });

        const existingFolders = await prisma.dataroomFolder.findMany({
          where: {
            dataroomId: dataroomId,
            parentId: selectedFolder, // Check only inside the target folder can be null
            removedAt: null,
          },
          select: { name: true },
        });
        if (existingFolders.length > 0) {
          const existingFolderNames = new Set(
            existingFolders.map((f) => f.name),
          );
          const duplicateNames = foldersToMove
            .map((folder) => folder.name)
            .filter((name) => existingFolderNames.has(name));

          if (duplicateNames.length > 0) {
            return res.status(409).json({
              message: `Cannot move folders: Duplicate names found inside target folder - ${duplicateNames.join(", ")}`,
            });
          }
        }
        // Fetch all nested subfolders of the selected folders
        const allSubfolders = await prisma.dataroomFolder.findMany({
          where: {
            dataroomId: dataroomId,
            removedAt: null,
            OR: foldersToMove.map((folder) => ({
              path: { startsWith: folder.path },
            })),
          },
        });

        const folderPathUpdates = new Map();

        // Generate new paths for the folders being moved
        foldersToMove.forEach((folder) => {
          const newPath =
            selectedFolderPath !== "/" && selectedFolderPath !== undefined
              ? `${selectedFolderPath}/${slugify(folder.name)}`
              : `/${slugify(folder.name)}`;

          folderPathUpdates.set(folder.id, newPath);
        });

        // Update all subfolder paths dynamically
        const updates = allSubfolders.map((subfolder) => {
          // Find the parent folder it belongs to
          const parentFolder = foldersToMove.find((folder) =>
            subfolder.path.startsWith(folder.path),
          );

          if (!parentFolder) return null;

          // Get the new base path for the parent
          const newParentPath = folderPathUpdates.get(parentFolder.id);

          // Calculate the new subfolder path by replacing the old path with the new one
          const relativePath = subfolder.path
            .replace(parentFolder.path, "")
            .trim();
          const newSubfolderPath = `${newParentPath}${relativePath}`;

          return prisma.dataroomFolder.update({
            where: { id: subfolder.id, dataroomId: dataroomId, removedAt: null },
            data: { path: newSubfolderPath },
          });
        });
        // Update each folder individually with its new path
        const updateMainFolders = folderIds.map((folderId) =>
          prisma.dataroomFolder.update({
            where: {
              id: folderId,
              dataroomId: dataroomId,
              removedAt: null,
            },
            data: {
              parentId: selectedFolder,
              path: folderPathUpdates.get(folderId),
            },
          }),
        );

        await Promise.all(updates);
        updatedFolders = await Promise.all(updateMainFolders);
      });

      if (updatedFolders.length === 0) {
        return res.status(404).end("No folder were updated");
      }

      // Get new path for folder unless folderId is null
      let folder: { path: string } | null = null;
      if (selectedFolder) {
        folder = await prisma.dataroomFolder.findUnique({
          where: { id: selectedFolder, dataroomId: dataroomId, removedAt: null },
          select: { path: true },
        });
      }
      return res.status(200).json({
        message: "Folder moved successfully",
        updatedCount: updatedFolders.length,
        newPath: folder?.path,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).end("Failed to move folder");
    }
  } else {
    // We only allow PATCH requests
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
