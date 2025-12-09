import prisma from "@/lib/prisma";

/**
 * Get filtered dataroom document IDs based on link permissions
 * @param dataroomId - The dataroom ID
 * @param linkId - The link ID (optional, for external visitors)
 * @returns Array of accessible dataroom document IDs
 */
export async function getFilteredDataroomDocumentIds(
  dataroomId: string,
  linkId?: string,
): Promise<string[]> {
  try {
    // If external visitor with link, check permission groups
    if (!linkId) {
      return [];
    }

    const link = await prisma.link.findUnique({
      where: { id: linkId, dataroomId },
      select: {
        permissionGroupId: true,
        groupId: true,
      },
    });

    if (!link) {
      return [];
    }

    let accessibleDocuments: { itemId: string }[] = [];

    if (link.permissionGroupId) {
      accessibleDocuments = await prisma.permissionGroupAccessControls.findMany(
        {
          where: {
            groupId: link.permissionGroupId,
            itemType: "DATAROOM_DOCUMENT",
            canView: true,
          },
          select: {
            itemId: true,
          },
        },
      );
    }

    if (link.groupId) {
      accessibleDocuments = await prisma.viewerGroupAccessControls.findMany({
        where: {
          groupId: link.groupId,
          itemType: "DATAROOM_DOCUMENT",
          canView: true,
        },
        select: {
          itemId: true,
        },
      });
    }

    const dataroomDocumentIds = accessibleDocuments.map(
      (document) => document.itemId,
    );

    return dataroomDocumentIds;
  } catch (error) {
    console.error("Error getting filtered file IDs:", error);
    throw new Error("Failed to get filtered file IDs");
  }
}
