import { NextApiResponse } from "next";

import slugify from "@sindresorhus/slugify";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/datarooms/:id/folders
    const {
      teamId,
      id: dataroomId,
      root,
      include_documents,
    } = req.query as {
      teamId: string;
      id: string;
      root?: string;
      include_documents?: string;
    };

    try {
      /** if root is present then only get root folders */
      if (root === "true") {
        const folders = await prisma.dataroomFolder.findMany({
          where: {
            dataroomId,
            parentId: null,
          },
          orderBy: [
            { orderIndex: "asc" },
            {
              name: "asc",
            },
          ],
          include: {
            _count: {
              select: { documents: true, childFolders: true },
            },
          },
        });

        return res.status(200).json(folders);
      }

      if (include_documents === "true") {
        const dataroomFolders = await prisma.dataroom.findUnique({
          where: {
            id: dataroomId,
          },
          select: {
            documents: {
              where: { folderId: null },
              orderBy: [{ orderIndex: "asc" }, { document: { name: "asc" } }],
              select: {
                id: true,
                folderId: true,
                document: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
            folders: {
              include: {
                documents: {
                  select: {
                    id: true,
                    folderId: true,
                    document: {
                      select: {
                        id: true,
                        name: true,
                        type: true,
                      },
                    },
                  },
                  orderBy: [
                    { orderIndex: "asc" },
                    { document: { name: "asc" } },
                  ],
                },
              },
              orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
            },
          },
        });

        const folders = [
          ...(dataroomFolders?.documents ?? []),
          ...(dataroomFolders?.folders ?? []),
        ];

        return res.status(200).json(folders);
      }

      const folders = await prisma.dataroomFolder.findMany({
        where: {
          dataroomId,
        },
        orderBy: [
          { orderIndex: "asc" },
          {
            name: "asc",
          },
        ],
        include: {
          documents: {
            select: {
              orderIndex: true,
              id: true,
              folderId: true,
              document: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
            orderBy: [
              { orderIndex: "asc" },
              {
                document: {
                  name: "asc",
                },
              },
            ],
          },
          childFolders: {
            include: {
              documents: {
                select: {
                  orderIndex: true,
                  id: true,
                  folderId: true,
                  document: {
                    select: {
                      id: true,
                      name: true,
                      type: true,
                    },
                  },
                },
                orderBy: [
                  { orderIndex: "asc" },
                  {
                    document: {
                      name: "asc",
                    },
                  },
                ],
              },
            },
          },
        },
      });

      return res.status(200).json(folders);
    } catch (error) {
      console.error("Request error", error);
      return res.status(500).json({ error: "Error fetching folders" });
    }
  },
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // POST /api/teams/:teamId/datarooms/:id/folders
    const { teamId, id: dataroomId } = req.query as {
      teamId: string;
      id: string;
    };

    const { name, path } = req.body as { name: string; path?: string };

    const parentFolderPath = path ? "/" + path : "/";

    try {
      const parentFolder = await prisma.dataroomFolder.findUnique({
        where: {
          dataroomId_path: {
            dataroomId: dataroomId,
            path: parentFolderPath,
          },
        },
        select: {
          id: true,
          name: true,
          path: true,
        },
      });

      // Duplicate name handling
      let folderName = name;
      let counter = 1;
      const MAX_RETRIES = 50;

      // Split path into segments
      // Slugify the final folder name
      const pathSegments = path ? path.split("/").filter(Boolean) : [];
      const basePath =
        pathSegments.length > 0 ? "/" + pathSegments.join("/") + "/" : "/";

      let childFolderPath = basePath + slugify(folderName);

      while (counter <= MAX_RETRIES) {
        const existingFolder = await prisma.dataroomFolder.findUnique({
          where: {
            dataroomId_path: {
              dataroomId: dataroomId,
              path: childFolderPath,
            },
          },
        });
        if (!existingFolder) break;
        folderName = `${name} (${counter})`;
        childFolderPath = basePath + slugify(folderName);
        counter++;
      }

      if (counter > MAX_RETRIES) {
        return res.status(400).json({
          error: "Failed to create folder",
          message: "Too many folders with similar names",
        });
      }

      const folder = await prisma.dataroomFolder.create({
        data: {
          name: folderName,
          path: childFolderPath,
          parentId: parentFolder?.id ?? null,
          dataroomId: dataroomId,
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
