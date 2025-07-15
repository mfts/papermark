import { NextApiResponse } from "next";

import slugify from "@sindresorhus/slugify";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, root } = req.query as { teamId: string; root?: string };

    try {
      /** if root is present then only get root folders */
      if (root === "true") {
        const folders = await prisma.folder.findMany({
          where: {
            teamId: teamId,
            parentId: null,
          },
          orderBy: {
            name: "asc",
          },
          include: {
            _count: {
              select: { documents: true, childFolders: true },
            },
          },
        });

        res.status(200).json(folders);
        return;
      }

      const folders = await prisma.folder.findMany({
        where: {
          teamId: teamId,
        },
        orderBy: {
          name: "asc",
        },
        include: {
          documents: {
            select: {
              id: true,
              name: true,
              folderId: true,
            },
          },
          childFolders: {
            include: {
              documents: {
                select: {
                  id: true,
                  name: true,
                  folderId: true,
                },
              },
            },
          },
        },
      });

      res.status(200).json(folders);
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ error: "Error fetching folders" });
    }
  },

  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };
    const { name, path } = req.body as { name: string; path: string };

    const parentFolderPath = path ? "/" + path : "/";

    try {
      const parentFolder = await prisma.folder.findUnique({
        where: {
          teamId_path: {
            teamId: teamId,
            path: parentFolderPath,
          },
        },
        select: {
          id: true,
          name: true,
          path: true,
        },
      });

      let folderName = name;
      let counter = 1;
      const MAX_RETRIES = 50;

      let childFolderPath = path
        ? "/" + path + "/" + slugify(folderName)
        : "/" + slugify(folderName);

      while (counter <= MAX_RETRIES) {
        const existingFolder = await prisma.folder.findUnique({
          where: {
            teamId_path: {
              teamId: teamId,
              path: childFolderPath,
            },
          },
        });

        if (!existingFolder) break;

        folderName = `${name} (${counter})`;
        childFolderPath = path
          ? "/" + path + "/" + slugify(folderName)
          : "/" + slugify(folderName);
        counter++;
      }

      if (counter > MAX_RETRIES) {
        res.status(400).json({
          error: "Failed to create folder",
          message: "Too many folders with similar names",
        });
        return;
      }

      const folder = await prisma.folder.create({
        data: {
          name: folderName,
          path: childFolderPath,
          parentId: parentFolder?.id ?? null,
          teamId: teamId,
        },
      });

      const folderWithDocs = {
        ...folder,
        documents: [],
        childFolders: [],
        parentFolderPath: parentFolderPath,
      };

      res.status(201).json(folderWithDocs);
    } catch (error) {
      console.error("Request error", error);
      res.status(500).json({ error: "Error creating folder" });
    }
  },
});
