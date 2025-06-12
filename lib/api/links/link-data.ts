import {
  ItemType,
  PermissionGroupAccessControls,
  ViewerGroupAccessControls,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { sortItemsByIndexAndName } from "@/lib/utils/sort-items-by-index-name";

export async function fetchDataroomLinkData({
  linkId,
  teamId,
  groupId,
  permissionGroupId,
}: {
  linkId: string;
  teamId: string;
  groupId?: string;
  permissionGroupId?: string;
}) {
  let groupPermissions:
    | ViewerGroupAccessControls[]
    | PermissionGroupAccessControls[] = [];
  let documentIds: string[] = [];
  let folderIds: string[] = [];

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
  }

  const linkData = await prisma.link.findUnique({
    where: { id: linkId, teamId },
    select: {
      dataroom: {
        select: {
          id: true,
          name: true,
          teamId: true,
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
                ? { id: { in: folderIds } }
                : undefined,
            orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
          },
        },
      },
      group: {
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
  };

  return { linkData, brand };
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
          documents: {
            where: { id: dataroomDocumentId },
            select: {
              id: true,
              updatedAt: true,
              orderIndex: true,
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
