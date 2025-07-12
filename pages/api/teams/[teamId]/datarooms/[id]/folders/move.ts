import { NextApiResponse } from "next";

import slugify from "@sindresorhus/slugify";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  PATCH: async (req: AuthenticatedRequest, res: NextApiResponse) => {
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
            userId: req.user.id,
          },
        },
      },
    });

    if (!team || team.users.length === 0 || team.datarooms.length === 0) {
      res.status(403).end("Forbidden");
      return;
    }

    try {
      let updatedFolders: any[] = [];
      await prisma.$transaction(async (prisma) => {
        const foldersToMove = await prisma.dataroomFolder.findMany({
          where: {
            id: { in: folderIds },
            dataroomId: dataroomId,
          },
        });

        const existingFolders = await prisma.dataroomFolder.findMany({
          where: {
            dataroomId: dataroomId,
            parentId: selectedFolder, // Check only inside the target folder can be null
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
            res.status(409).json({
              message: `Cannot move folders: Duplicate names found inside target folder - ${duplicateNames.join(", ")}`,
            });
            return;
          }
        }
        // Fetch all nested subfolders of the selected folders
        const allSubfolders = await prisma.dataroomFolder.findMany({
          where: {
            dataroomId: dataroomId,
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
            where: { id: subfolder.id, dataroomId: dataroomId },
            data: { path: newSubfolderPath },
          });
        });
        // Update each folder individually with its new path
        const updateMainFolders = folderIds.map((folderId) =>
          prisma.dataroomFolder.update({
            where: {
              id: folderId,
              dataroomId: dataroomId,
            },
            data: {
              parentId: selectedFolder,
              path: folderPathUpdates.get(folderId),
              orderIndex: null,
            },
          }),
        );

        await Promise.all(updates);
        updatedFolders = await Promise.all(updateMainFolders);
      });

      if (updatedFolders.length === 0) {
        res.status(404).end("No folder were updated");
        return;
      }

      // Get new path for folder unless folderId is null
      let folder: { path: string } | null = null;
      if (selectedFolder) {
        folder = await prisma.dataroomFolder.findUnique({
          where: { id: selectedFolder, dataroomId: dataroomId },
          select: { path: true },
        });
      }
      res.status(200).json({
        message: "Folder moved successfully",
        updatedCount: updatedFolders.length,
        newPath: folder?.path,
      });
    } catch (error) {
      console.error(error);
      res.status(500).end("Failed to move folder");
    }
  },
});
