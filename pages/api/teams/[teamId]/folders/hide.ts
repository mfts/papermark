import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/folders/hide
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };
    const userId = (session.user as CustomUser).id;

    const { folderIds, hidden } = req.body as {
      folderIds: string[];
      hidden: boolean;
    };

    if (!folderIds || !Array.isArray(folderIds) || folderIds.length === 0) {
      return res.status(400).json({ error: "Folder IDs are required" });
    }

    if (typeof hidden !== "boolean") {
      return res.status(400).json({ error: "Hidden flag is required" });
    }

    try {
      // Check team access
      const teamAccess = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!teamAccess) {
        return res.status(401).end("Unauthorized");
      }

      // Get the folders to find their paths for cascading
      const folders = await prisma.folder.findMany({
        where: {
          id: { in: folderIds },
          teamId,
        },
        select: {
          id: true,
          path: true,
        },
      });

      if (folders.length === 0) {
        return res.status(404).json({ error: "No folders found" });
      }

      // Update the selected folders
      const folderResult = await prisma.folder.updateMany({
        where: {
          id: { in: folderIds },
          teamId,
        },
        data: {
          hiddenInAllDocuments: hidden,
        },
      });

      // Build path conditions for cascading to child folders
      // Cascade: hide/unhide all subfolders and documents that have paths starting with the hidden folder paths
      const pathConditions = folders.map((folder) => ({
        path: {
          startsWith: folder.path + "/",
        },
      }));

      // Update child folders (cascade)
      let childFolderCount = 0;
      if (pathConditions.length > 0) {
        const childFolderResult = await prisma.folder.updateMany({
          where: {
            teamId,
            OR: pathConditions,
          },
          data: {
            hiddenInAllDocuments: hidden,
          },
        });
        childFolderCount = childFolderResult.count;
      }

      // Update documents in these folders and subfolders
      // Get all folder IDs (selected + children)
      const allFolderPaths = folders.map((f) => f.path);
      const childFolders = await prisma.folder.findMany({
        where: {
          teamId,
          OR: pathConditions.length > 0 ? pathConditions : [{ id: "none" }],
        },
        select: {
          id: true,
          path: true,
        },
      });

      const allFolderIds = [
        ...folderIds,
        ...childFolders.map((f) => f.id),
      ];

      // Update documents in all affected folders
      const documentResult = await prisma.document.updateMany({
        where: {
          teamId,
          folderId: { in: allFolderIds },
        },
        data: {
          hiddenInAllDocuments: hidden,
        },
      });

      return res.status(200).json({
        message: `${folderResult.count} folder(s) and ${documentResult.count} document(s) ${hidden ? "hidden" : "unhidden"} successfully`,
        foldersCount: folderResult.count + childFolderCount,
        documentsCount: documentResult.count,
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
