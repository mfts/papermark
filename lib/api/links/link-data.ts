import { ItemType, ViewerGroupAccessControls } from "@prisma/client";

import prisma from "@/lib/prisma";
import { sortItemsByIndexAndName } from "@/lib/utils/sort-items-by-index-name";

export async function fetchDataroomLinkData({
  linkId,
  teamId,
  groupId,
}: {
  linkId: string;
  teamId: string;
  groupId?: string;
}) {
  let groupPermissions: ViewerGroupAccessControls[] = [];
  let documentIds: string[] = [];
  let folderIds: string[] = [];

  if (groupId) {
    groupPermissions = await prisma.viewerGroupAccessControls.findMany({
      where: {
        groupId,
        OR: [{ canView: true }, { canDownload: true }],
      },
    });

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
              groupPermissions.length > 0 || groupId
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
              groupPermissions.length > 0 || groupId
                ? { id: { in: folderIds } }
                : undefined,
            orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
          },
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

  const brand = await prisma.dataroomBrand.findFirst({
    where: {
      dataroomId: linkData.dataroom.id,
    },
    select: {
      logo: true,
      banner: true,
      brandColor: true,
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
