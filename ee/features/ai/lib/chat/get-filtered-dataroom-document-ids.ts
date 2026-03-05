import { ItemType } from "@prisma/client";

import prisma from "@/lib/prisma";

/**
 * Get filtered dataroom document IDs based on link permissions
 * @param dataroomId - The dataroom ID
 * @param linkId - The link ID (optional, for external visitors)
 * @returns Array of accessible dataroom document IDs, or undefined if unrestricted
 */
export async function getFilteredDataroomDocumentIds(
  dataroomId: string,
  linkId?: string,
): Promise<string[] | undefined> {
  const getDescendantFolderIds = (
    rootFolderIds: string[],
    folders: { id: string; parentId: string | null }[],
    deniedFolderIds: Set<string>,
  ): Set<string> => {
    const folderIds = new Set(rootFolderIds);
    const queue = [...rootFolderIds];

    // Build parent -> children map for O(1) descendant traversal
    const childFoldersByParent = new Map<string, string[]>();
    for (const folder of folders) {
      if (!folder.parentId) continue;
      const children = childFoldersByParent.get(folder.parentId) ?? [];
      children.push(folder.id);
      childFoldersByParent.set(folder.parentId, children);
    }

    while (queue.length > 0) {
      const currentFolderId = queue.shift();
      if (!currentFolderId) continue;

      const children = childFoldersByParent.get(currentFolderId) ?? [];
      for (const childFolderId of children) {
        // Explicit deny on a folder should block inherited access via parent folder.
        if (deniedFolderIds.has(childFolderId)) {
          continue;
        }

        if (folderIds.has(childFolderId)) continue;
        folderIds.add(childFolderId);
        queue.push(childFolderId);
      }
    }

    return folderIds;
  };

  try {
    // No link means this is an internal/team context without link-level restrictions
    if (!linkId) {
      return undefined;
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

    // If link has no group restrictions, treat as unrestricted dataroom access
    if (!link.groupId && !link.permissionGroupId) {
      return undefined;
    }

    let accessControls: {
      itemId: string;
      itemType: ItemType;
      canView: boolean;
      canDownload: boolean;
    }[] = [];

    if (link.permissionGroupId) {
      accessControls = await prisma.permissionGroupAccessControls.findMany({
        where: {
          groupId: link.permissionGroupId,
          itemType: {
            in: [ItemType.DATAROOM_DOCUMENT, ItemType.DATAROOM_FOLDER],
          },
        },
        select: {
          itemId: true,
          itemType: true,
          canView: true,
          canDownload: true,
        },
      });
    }

    if (link.groupId) {
      // Legacy group permissions take precedence when present
      accessControls = await prisma.viewerGroupAccessControls.findMany({
        where: {
          groupId: link.groupId,
          itemType: {
            in: [ItemType.DATAROOM_DOCUMENT, ItemType.DATAROOM_FOLDER],
          },
        },
        select: {
          itemId: true,
          itemType: true,
          canView: true,
          canDownload: true,
        },
      });
    }

    const isAllowed = (control: { canView: boolean; canDownload: boolean }) =>
      control.canView || control.canDownload;

    const explicitlyAllowedDocumentIds = new Set(
      accessControls
        .filter(
          (permission) =>
            permission.itemType === ItemType.DATAROOM_DOCUMENT &&
            isAllowed(permission),
        )
        .map((permission) => permission.itemId),
    );

    const explicitlyDeniedDocumentIds = new Set(
      accessControls
        .filter(
          (permission) =>
            permission.itemType === ItemType.DATAROOM_DOCUMENT &&
            !isAllowed(permission),
        )
        .map((permission) => permission.itemId),
    );

    const allowedFolderIds = accessControls
      .filter(
        (permission) =>
          permission.itemType === ItemType.DATAROOM_FOLDER &&
          isAllowed(permission),
      )
      .map((permission) => permission.itemId);

    const deniedFolderIds = new Set(
      accessControls
        .filter(
          (permission) =>
            permission.itemType === ItemType.DATAROOM_FOLDER &&
            !isAllowed(permission),
        )
        .map((permission) => permission.itemId),
    );

    if (allowedFolderIds.length > 0) {
      const folders = await prisma.dataroomFolder.findMany({
        where: { dataroomId },
        select: {
          id: true,
          parentId: true,
        },
      });

      // Start from explicitly allowed folder IDs and include descendants,
      // while respecting explicit folder denies.
      const accessibleFolderIds = Array.from(
        getDescendantFolderIds(allowedFolderIds, folders, deniedFolderIds),
      );

      if (accessibleFolderIds.length > 0) {
        const folderDocuments = await prisma.dataroomDocument.findMany({
          where: {
            dataroomId,
            folderId: { in: accessibleFolderIds },
          },
          select: {
            id: true,
          },
        });

        for (const document of folderDocuments) {
          explicitlyAllowedDocumentIds.add(document.id);
        }
      }
    }

    // Explicit document denies should always override inherited folder access.
    for (const deniedDocumentId of explicitlyDeniedDocumentIds) {
      explicitlyAllowedDocumentIds.delete(deniedDocumentId);
    }

    return Array.from(explicitlyAllowedDocumentIds);
  } catch (error) {
    console.error("Error getting filtered file IDs:", error);
    throw new Error("Failed to get filtered file IDs");
  }
}
