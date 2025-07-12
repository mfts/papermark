import { NextApiResponse } from "next";

import slugify from "@sindresorhus/slugify";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  PATCH: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };
    const { folderIds, selectedFolder, selectedFolderPath } = req.body as {
      folderIds: string[];
      selectedFolder: string | null;
      selectedFolderPath: string;
    };

    try {
      let updatedFolders: any[] = [];
      await prisma.$transaction(async (prisma) => {
        const foldersToMove = await prisma.folder.findMany({
          where: {
            id: { in: folderIds },
            teamId,
          },
        });

        const existingFolders = await prisma.folder.findMany({
          where: {
            teamId,
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
        const allSubfolders = await prisma.folder.findMany({
          where: {
            teamId,
            OR: foldersToMove.map((folder) => ({
              path: { startsWith: folder.path },
            })),
          },
        });
        const folderPathUpdates = new Map();
        // Generate new paths for the folders being moved
        foldersToMove.forEach((folder) => {
          const newPath =
            selectedFolderPath !== "/"
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

          return prisma.folder.update({
            where: { id: subfolder.id, teamId },
            data: { path: newSubfolderPath },
          });
        });

        // Update each folder individually with its new path
        const updateMainFolders = folderIds.map((folderId) =>
          prisma.folder.update({
            where: {
              id: folderId,
              teamId,
            },
            data: {
              parentId: selectedFolder,
              path: folderPathUpdates.get(folderId),
            },
          }),
        );

        await Promise.all(updates);
        updatedFolders = await Promise.all(updateMainFolders);

        // Get new path for folder unless selectedFolder is null
      });
      if (updatedFolders.length === 0) {
        res.status(404).end("No Folder were updated");
        return;
      }

      let folder: { path: string } | null = null;
      if (selectedFolder) {
        folder = await prisma.folder.findUnique({
          where: { id: selectedFolder, teamId },
          select: { path: true },
        });
      }

      res.status(200).json({
        message: "Folder moved successfully",
        updatedCount: updatedFolders.length,
        newPath: folder?.path,
      });
    } catch (error) {
      res.status(500).end(error);
    }
  },
});
