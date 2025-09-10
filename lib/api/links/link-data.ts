import {
  ItemType,
  PermissionGroupAccessControls,
  ViewerGroupAccessControls,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { sortItemsByIndexAndName } from "@/lib/utils/sort-items-by-index-name";

// Helper function to get all parent folder IDs for given folder IDs
async function getAllParentFolderIds(
  folderIds: string[],
  dataroomId: string,
): Promise<string[]> {
  if (folderIds.length === 0) return [];

  const allRequiredFolderIds = new Set(folderIds);

  // Get all folders in the dataroom to build the hierarchy
  const allFolders = await prisma.dataroomFolder.findMany({
    where: { dataroomId },
    select: { id: true, parentId: true },
  });

  // Use Map for O(1) parent lookup: folderId -> parentId
  // This is more efficient than Set because we need key-value relationship for traversal
  const folderMap = new Map(
    allFolders.map((folder) => [folder.id, folder.parentId]),
  );

  // For each accessible folder, traverse up to find all parent folders
  for (const folderId of folderIds) {
    let currentId: string | null = folderId;

    while (currentId) {
      allRequiredFolderIds.add(currentId);
      currentId = folderMap.get(currentId) || null;
    }
  }

  return Array.from(allRequiredFolderIds);
}

export async function fetchDataroomLinkData({
  linkId,
  dataroomId,
  teamId,
  groupId,
  permissionGroupId,
}: {
  linkId: string;
  dataroomId: string | null;
  teamId: string;
  groupId?: string;
  permissionGroupId?: string;
}) {
  let groupPermissions:
    | ViewerGroupAccessControls[]
    | PermissionGroupAccessControls[] = [];
  let documentIds: string[] = [];
  let folderIds: string[] = [];
  let allRequiredFolderIds: string[] = [];

  const effectiveGroupId = groupId || permissionGroupId;

  if (effectiveGroupId) {
    // Check if this is a ViewerGroup (legacy) or PermissionGroup
    // First try to find ViewerGroup permissions (for backwards compatibility)
    if (groupId) {
      // This is a ViewerGroup (legacy behavior)
      groupPermissions = await prisma.viewerGroupAccessControls.findMany({
        where: {
          groupId: groupId,
          OR: [{ canView: true }, { canDownload: true }],
        },
      });
    } else if (permissionGroupId) {
      // This is a PermissionGroup (new behavior)
      groupPermissions = await prisma.permissionGroupAccessControls.findMany({
        where: {
          groupId: permissionGroupId,
          OR: [{ canView: true }, { canDownload: true }],
        },
      });
    }

    documentIds = groupPermissions
      .filter(
        (permission) => permission.itemType === ItemType.DATAROOM_DOCUMENT,
      )
      .map((permission) => permission.itemId);
    folderIds = groupPermissions
      .filter((permission) => permission.itemType === ItemType.DATAROOM_FOLDER)
      .map((permission) => permission.itemId);

    // Include parent folders if we have group permissions and they're actually being applied
    // This ensures that if a group has access to a subfolder, all parent folders
    // are also included to maintain proper hierarchy (even without explicit permissions)
    allRequiredFolderIds = folderIds;
    if (dataroomId && folderIds.length > 0) {
      allRequiredFolderIds = await getAllParentFolderIds(folderIds, dataroomId);
    }
  }

  const linkData = await prisma.link.findUnique({
    where: { id: linkId, teamId },
    select: {
      dataroom: {
        select: {
          id: true,
          name: true,
          teamId: true,
          allowBulkDownload: true,
          createdAt: true,
          documents: {
            where:
              groupPermissions.length > 0 || effectiveGroupId
                ? { id: { in: documentIds } }
                : undefined,
            select: {
              id: true,
              folderId: true,
              updatedAt: true,
              orderIndex: true,
              hierarchicalIndex: true,
              document: {
                select: {
                  id: true,
                  name: true,
                  advancedExcelEnabled: true,
                  downloadOnly: true,
                  versions: {
                    where: { isPrimary: true },
                    select: {
                      id: true,
                      versionNumber: true,
                      type: true,
                      hasPages: true,
                      file: true,
                      isVertical: true,
                      updatedAt: true,
                    },
                    take: 1,
                  },
                },
              },
            },
            orderBy: [
              { orderIndex: "asc" },
              {
                document: { name: "asc" },
              },
            ],
          },
          folders: {
            where:
              groupPermissions.length > 0 || effectiveGroupId
                ? { id: { in: allRequiredFolderIds } }
                : undefined,
            select: {
              id: true,
              name: true,
              path: true,
              parentId: true,
              dataroomId: true,
              orderIndex: true,
              hierarchicalIndex: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
          },
        },
      },
      group: {
        select: {
          accessControls: true,
        },
      },
      permissionGroup: {
        select: {
          accessControls: true,
        },
      },
    },
  });

  if (!linkData?.dataroom) {
    throw new Error("Dataroom not found");
  }

  // Sort documents by index or name
  linkData.dataroom.documents = sortItemsByIndexAndName(
    linkData.dataroom.documents,
  );

  const dataroomBrand = await prisma.dataroomBrand.findFirst({
    where: {
      dataroomId: linkData.dataroom.id,
    },
    select: {
      logo: true,
      banner: true,
      brandColor: true,
      accentColor: true,
      welcomeMessage: true,
    },
  });

  const teamBrand = await prisma.brand.findFirst({
    where: {
      teamId: linkData.dataroom.teamId,
    },
    select: {
      logo: true,
      brandColor: true,
      accentColor: true,
    },
  });

  const brand = {
    logo: dataroomBrand?.logo || teamBrand?.logo,
    banner: dataroomBrand?.banner || null,
    brandColor: dataroomBrand?.brandColor || teamBrand?.brandColor,
    accentColor: dataroomBrand?.accentColor || teamBrand?.accentColor,
    welcomeMessage: dataroomBrand?.welcomeMessage,
  };

  // Extract access controls from either ViewerGroup or PermissionGroup
  const accessControls =
    linkData.group?.accessControls ||
    linkData.permissionGroup?.accessControls ||
    [];

  return { linkData, brand, accessControls };
}

export async function fetchDataroomDocumentLinkData({
  linkId,
  teamId,
  dataroomDocumentId,
  groupId,
  permissionGroupId,
}: {
  linkId: string;
  teamId: string;
  dataroomDocumentId: string;
  groupId?: string;
  permissionGroupId?: string;
}) {
  let groupPermissions:
    | ViewerGroupAccessControls[]
    | PermissionGroupAccessControls[] = [];

  const effectiveGroupId = groupId || permissionGroupId;

  if (effectiveGroupId) {
    let hasAccess = false;

    if (groupId) {
      // This is a ViewerGroup (legacy behavior)
      groupPermissions = await prisma.viewerGroupAccessControls.findMany({
        where: {
          groupId: groupId,
          itemId: dataroomDocumentId,
          itemType: ItemType.DATAROOM_DOCUMENT,
          OR: [{ canView: true }, { canDownload: true }],
        },
      });
      hasAccess = groupPermissions.length > 0;
    } else if (permissionGroupId) {
      // This is a PermissionGroup (new behavior)
      groupPermissions = await prisma.permissionGroupAccessControls.findMany({
        where: {
          groupId: permissionGroupId,
          itemId: dataroomDocumentId,
          itemType: ItemType.DATAROOM_DOCUMENT,
          OR: [{ canView: true }, { canDownload: true }],
        },
      });
      hasAccess = groupPermissions.length > 0;
    }

    // if it's a group/permission link, we need to check if the document is accessible
    if (!hasAccess) {
      throw new Error("Document not found in group");
    }
  }

  const linkData = await prisma.link.findUnique({
    where: { id: linkId, teamId, linkType: "DATAROOM_LINK" },
    select: {
      dataroom: {
        select: {
          id: true,
          name: true,
          allowBulkDownload: true,
          documents: {
            where: { id: dataroomDocumentId },
            select: {
              id: true,
              updatedAt: true,
              orderIndex: true,
              hierarchicalIndex: true,
              document: {
                select: {
                  id: true,
                  name: true,
                  advancedExcelEnabled: true,
                  downloadOnly: true,
                  versions: {
                    where: { isPrimary: true },
                    select: {
                      id: true,
                      versionNumber: true,
                      type: true,
                      hasPages: true,
                      file: true,
                      isVertical: true,
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!linkData?.dataroom) {
    throw new Error("Dataroom not found");
  }

  const brand = await prisma.dataroomBrand.findFirst({
    where: {
      dataroomId: linkData.dataroom.id,
    },
    select: {
      logo: true,
      banner: true,
      brandColor: true,
      accentColor: true,
      welcomeMessage: true,
    },
  });

  return { linkData, brand };
}

export async function fetchDocumentLinkData({
  linkId,
  teamId,
}: {
  linkId: string;
  teamId: string;
}) {
  const linkData = await prisma.link.findUnique({
    where: { id: linkId, teamId },
    select: {
      document: {
        select: {
          id: true,
          name: true,
          assistantEnabled: true,
          advancedExcelEnabled: true,
          downloadOnly: true,
          teamId: true,
          ownerId: true,
          team: {
            select: { plan: true },
          },
          versions: {
            where: { isPrimary: true },
            select: {
              id: true,
              versionNumber: true,
              type: true,
              hasPages: true,
              file: true,
              isVertical: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!linkData?.document) {
    throw new Error("Document not found");
  }

  const brand = await prisma.brand.findFirst({
    where: {
      teamId: linkData.document.teamId,
    },
    select: {
      logo: true,
      brandColor: true,
      accentColor: true,
    },
  });

  return { linkData, brand };
}
