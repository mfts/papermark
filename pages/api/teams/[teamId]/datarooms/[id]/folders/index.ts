import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { DefaultPermissionStrategy, ItemType } from "@prisma/client";
import slugify from "@sindresorhus/slugify";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

async function applyFolderPermissions(
  dataroomId: string,
  folderId: string,
  folderPath: string,
): Promise<void> {
  try {
    await applyDefaultFolderPermissions(dataroomId, folderId);
  } catch (error) {
    console.error("Error applying folder permissions:", error);
    throw error;
  }
}

async function applyDefaultFolderPermissions(
  dataroomId: string,
  folderId: string,
) {
  const [dataroom, viewerGroups, permissionGroups] = await Promise.all([
    prisma.dataroom.findUnique({
      where: { id: dataroomId },
      select: {
        defaultPermissionStrategy: true,
        teamId: true,
      },
    }),
    prisma.viewerGroup.findMany({
      where: { dataroomId },
      select: {
        id: true,
      },
    }),
    prisma.permissionGroup.findMany({
      where: { dataroomId },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!dataroom) return;

  const allPermissionGroupData: {
    groupId: string;
    itemId: string;
    itemType: ItemType;
    canView: boolean;
    canDownload: boolean;
    canDownloadOriginal: boolean;
  }[] = [];

  if (permissionGroups.length > 0) {
    if (
      dataroom.defaultPermissionStrategy ===
      DefaultPermissionStrategy.INHERIT_FROM_PARENT
    ) {
      permissionGroups.forEach((group) => {
        allPermissionGroupData.push({
          groupId: group.id,
          itemId: folderId,
          itemType: ItemType.DATAROOM_FOLDER,
          canView: true,
          canDownload: false,
          canDownloadOriginal: false,
        });
      });
    }
    // For other strategies (ASK_EVERY_TIME, HIDDEN_BY_DEFAULT), don't auto-create permissions
  }

  const viewerGroupData = viewerGroups.map((group) => ({
    groupId: group.id,
    itemId: folderId,
    itemType: ItemType.DATAROOM_FOLDER,
    canView:
      dataroom.defaultPermissionStrategy ===
      DefaultPermissionStrategy.INHERIT_FROM_PARENT,
    canDownload: false,
  }));

  await Promise.all([
    viewerGroupData.length > 0 &&
      dataroom.defaultPermissionStrategy ===
        DefaultPermissionStrategy.INHERIT_FROM_PARENT &&
      prisma.viewerGroupAccessControls.createMany({
        data: viewerGroupData,
        skipDuplicates: true,
      }),
    allPermissionGroupData.length > 0 &&
      prisma.permissionGroupAccessControls.createMany({
        data: allPermissionGroupData,
        skipDuplicates: true,
      }),
  ]);
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/folders
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const userId = (session.user as CustomUser).id;
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

      /** if root is present then only get root folders */
      if (root === "true") {
        const folders = await prisma.dataroomFolder.findMany({
          where: {
            dataroomId,
            parentId: null,
          },
          orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
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
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/:id/folders
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

    const { name, path } = req.body as { name: string; path?: string };

    const parentFolderPath = path ? "/" + path : "/";

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

      await applyFolderPermissions(dataroomId, folder.id, childFolderPath);

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
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
