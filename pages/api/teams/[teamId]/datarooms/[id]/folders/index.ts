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
    await applyDefaultFolderPermissions(dataroomId, folderId, folderPath);
  } catch (error) {
    console.error("Error applying folder permissions:", error);
    throw error;
  }
}

async function applyDefaultFolderPermissions(
  dataroomId: string,
  folderId: string,
  folderPath?: string,
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

  if (
    dataroom.defaultPermissionStrategy ===
      DefaultPermissionStrategy.INHERIT_FROM_PARENT &&
    folderPath
  ) {
    // If we have a folder path, inherit from parent folder
    await inheritFolderPermissionsFromParent(dataroomId, folderId, folderPath);
    return;
  }

  // Fallback to default behavior (for root folders or non-inherit strategies)
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
          canView: true, // Root folders get view permissions by default
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

async function inheritFolderPermissionsFromParent(
  dataroomId: string,
  folderId: string,
  folderPath: string,
) {
  // Get parent folder path
  const pathSegments = folderPath.split("/").filter(Boolean);
  const parentPath = "/" + pathSegments.slice(0, -1).join("/");

  // If this is a root folder, apply default permissions
  if (parentPath === "/") {
    await applyDefaultFolderPermissions(dataroomId, folderId);
    return;
  }

  const parentFolder = await prisma.dataroomFolder.findUnique({
    where: {
      dataroomId_path: { dataroomId, path: parentPath },
    },
    select: { id: true },
  });

  if (!parentFolder) {
    // If no parent folder found, apply default permissions
    await applyDefaultFolderPermissions(dataroomId, folderId);
    return;
  }

  // Get existing permissions for the parent folder
  const [parentViewerPermissions, parentPermissionGroupPermissions] =
    await Promise.all([
      prisma.viewerGroupAccessControls.findMany({
        where: {
          itemId: parentFolder.id,
          itemType: ItemType.DATAROOM_FOLDER,
        },
        select: { groupId: true, canView: true, canDownload: true },
      }),
      prisma.permissionGroupAccessControls.findMany({
        where: {
          itemId: parentFolder.id,
          itemType: ItemType.DATAROOM_FOLDER,
        },
        select: {
          groupId: true,
          canView: true,
          canDownload: true,
          canDownloadOriginal: true,
        },
      }),
    ]);

  // Apply parent permissions to the new folder
  await prisma.$transaction(async (tx) => {
    const viewerGroupPermissionsToCreate: any[] = [];
    const permissionGroupPermissionsToCreate: any[] = [];

    parentViewerPermissions.forEach((parentPerm) => {
      viewerGroupPermissionsToCreate.push({
        groupId: parentPerm.groupId,
        itemId: folderId,
        itemType: ItemType.DATAROOM_FOLDER,
        canView: parentPerm.canView,
        canDownload: parentPerm.canDownload,
      });
    });

    parentPermissionGroupPermissions.forEach((parentPerm) => {
      permissionGroupPermissionsToCreate.push({
        groupId: parentPerm.groupId,
        itemId: folderId,
        itemType: ItemType.DATAROOM_FOLDER,
        canView: parentPerm.canView,
        canDownload: parentPerm.canDownload,
        canDownloadOriginal: parentPerm.canDownloadOriginal,
      });
    });

    if (viewerGroupPermissionsToCreate.length > 0) {
      await tx.viewerGroupAccessControls.createMany({
        data: viewerGroupPermissionsToCreate,
        skipDuplicates: true,
      });
    }

    if (permissionGroupPermissionsToCreate.length > 0) {
      await tx.permissionGroupAccessControls.createMany({
        data: permissionGroupPermissionsToCreate,
        skipDuplicates: true,
      });
    }
  });
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
          select: {
            id: true,
            name: true,
            path: true,
            parentId: true,
            dataroomId: true,
            orderIndex: true,
            hierarchicalIndex: true,
            icon: true,
            color: true,
            createdAt: true,
            updatedAt: true,
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
                hierarchicalIndex: true,
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
              select: {
                id: true,
                name: true,
                path: true,
                parentId: true,
                dataroomId: true,
                orderIndex: true,
                hierarchicalIndex: true,
                icon: true,
                color: true,
                createdAt: true,
                updatedAt: true,
                documents: {
                  select: {
                    id: true,
                    folderId: true,
                    hierarchicalIndex: true,
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
        select: {
          id: true,
          name: true,
          path: true,
          parentId: true,
          dataroomId: true,
          orderIndex: true,
          hierarchicalIndex: true,
          icon: true,
          color: true,
          createdAt: true,
          updatedAt: true,
          documents: {
            select: {
              orderIndex: true,
              id: true,
              folderId: true,
              hierarchicalIndex: true,
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

    const { name, path, icon, color } = req.body as {
      name: string;
      path?: string;
      icon?: string;
      color?: string;
    };

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
          icon: icon ?? null,
          color: color ?? null,
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
