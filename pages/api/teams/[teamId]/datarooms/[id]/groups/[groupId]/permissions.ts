import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ItemType } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

// Helper function to get parent folder IDs for a given document in a dataroom
async function getParentFolderIds(
  dataroomId: string,
  documentId: string,
): Promise<string[]> {
  // Get the dataroom document to find which folder it's in
  const dataroomDocument = await prisma.dataroomDocument.findUnique({
    where: { id: documentId },
    select: { folderId: true },
  });

  if (!dataroomDocument?.folderId) {
    return []; // Document is at root level
  }

  // Get the folder and walk up the hierarchy
  const parentFolders: string[] = [];
  let currentFolderId: string | null = dataroomDocument.folderId;

  while (currentFolderId) {
    parentFolders.push(currentFolderId);

    const folder: { parentId: string | null } | null =
      await prisma.dataroomFolder.findUnique({
        where: { id: currentFolderId },
        select: { parentId: true },
      });

    currentFolderId = folder?.parentId || null;
  }

  return parentFolders;
}

// Helper function to ensure parent folders are visible when child documents are made visible
async function ensureParentFoldersVisible(
  dataroomId: string,
  groupId: string,
  permissions: Record<
    string,
    { itemType: ItemType; view: boolean; download: boolean }
  >,
): Promise<void> {
  const foldersToMakeVisible = new Set<string>();

  // Find all documents that are being made visible
  const visibleDocuments = Object.entries(permissions)
    .filter(
      ([_, perm]) => perm.itemType === ItemType.DATAROOM_DOCUMENT && perm.view,
    )
    .map(([itemId, _]) => itemId);

  // Get parent folder IDs for all visible documents
  for (const documentId of visibleDocuments) {
    const parentFolders = await getParentFolderIds(dataroomId, documentId);
    parentFolders.forEach((folderId) => foldersToMakeVisible.add(folderId));
  }

  // Also handle folders that are being made visible - ensure their parent folders are visible too
  const visibleFolders = Object.entries(permissions)
    .filter(
      ([_, perm]) => perm.itemType === ItemType.DATAROOM_FOLDER && perm.view,
    )
    .map(([itemId, _]) => itemId);

  for (const folderId of visibleFolders) {
    let currentFolderId: string | null = folderId;

    while (currentFolderId) {
      const folder: { parentId: string | null } | null =
        await prisma.dataroomFolder.findUnique({
          where: { id: currentFolderId },
          select: { parentId: true },
        });

      if (folder?.parentId) {
        foldersToMakeVisible.add(folder.parentId);
        currentFolderId = folder.parentId;
      } else {
        break;
      }
    }
  }

  // Update or create permissions for parent folders to make them visible
  if (foldersToMakeVisible.size > 0) {
    const foldersToUpdate = Array.from(foldersToMakeVisible);

    await prisma.$transaction(async (tx) => {
      for (const folderId of foldersToUpdate) {
        await tx.viewerGroupAccessControls.upsert({
          where: {
            groupId_itemId: {
              groupId: groupId,
              itemId: folderId,
            },
          },
          create: {
            groupId: groupId,
            itemId: folderId,
            itemType: ItemType.DATAROOM_FOLDER,
            canView: true,
            canDownload: false,
          },
          update: {
            canView: true, // Always ensure parent folders are visible
            // Don't change canDownload - preserve existing setting
          },
        });
      }
    });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // POST /api/teams/:teamId/datarooms/:id/groups/:groupId/permissions
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).end("Unauthorized");
    return;
  }

  const userId = (session.user as CustomUser).id;
  const {
    teamId,
    id: dataroomId,
    groupId,
  } = req.query as {
    teamId: string;
    id: string;
    groupId: string;
  };

  try {
    const { permissions } = req.body as {
      permissions: Record<
        string,
        { itemType: ItemType; view: boolean; download: boolean }
      >;
    };

    // Validate input
    if (!permissions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if the user is part of the team
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId,
          },
        },
      },
    });

    if (!team) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const existingPermissions = await prisma.viewerGroupAccessControls.findMany(
      {
        where: {
          groupId,
          group: { dataroomId },
        },
        select: { itemId: true, itemType: true },
      },
    );

    const existingSet = new Set(
      existingPermissions.map((p) => `${p.itemId}-${p.itemType}`),
    );

    const toUpdate: {
      groupId: string;
      itemId: string;
      itemType: ItemType;
      canView: boolean;
      canDownload: boolean;
    }[] = [];
    const toCreate: {
      groupId: string;
      itemId: string;
      itemType: ItemType;
      canView: boolean;
      canDownload: boolean;
    }[] = [];

    Object.entries(permissions).forEach(([itemId, itemPermissions]) => {
      const key = `${itemId}-${itemPermissions.itemType}`;
      const data = {
        groupId,
        itemId,
        itemType: itemPermissions.itemType,
        canView: itemPermissions.view,
        canDownload: itemPermissions.download,
      };

      if (existingSet.has(key)) {
        toUpdate.push(data);
      } else {
        toCreate.push(data);
      }
    });

    console.log("toUpdate", toUpdate);
    console.log("toCreate", toCreate);

    // Perform operations
    await prisma.$transaction(async (tx) => {
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((item) =>
            tx.viewerGroupAccessControls.update({
              where: {
                groupId_itemId: {
                  groupId: item.groupId,
                  itemId: item.itemId,
                },
              },
              data: {
                canView: item.canView,
                canDownload: item.canDownload,
              },
            }),
          ),
        );
      }

      if (toCreate.length > 0) {
        await tx.viewerGroupAccessControls.createMany({
          data: toCreate,
        });
      }
    });

    // After saving permissions, ensure parent folders are visible for any items that were made visible
    await ensureParentFoldersVisible(dataroomId, groupId, permissions);

    res.status(200).json({ message: "Permissions updated successfully" });
  } catch (error) {
    console.error("Error updating permissions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
