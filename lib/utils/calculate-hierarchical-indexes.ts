import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

interface DataroomItem {
  id: string;
  name: string;
  orderIndex: number | null;
  parentId?: string | null;
  folderId?: string | null;
  type: "folder" | "document";
}

interface HierarchicalItem extends DataroomItem {
  hierarchicalIndex: string;
  children: HierarchicalItem[];
}

/**
 * Sorts items by orderIndex first (nulls last), then by name
 */
function sortItems(items: DataroomItem[]): DataroomItem[] {
  return items.sort((a, b) => {
    // First sort by orderIndex (nulls go to the end)
    if (a.orderIndex !== null && b.orderIndex !== null) {
      if (a.orderIndex !== b.orderIndex) {
        return a.orderIndex - b.orderIndex;
      }
    } else if (a.orderIndex !== null) {
      return -1; // a comes first
    } else if (b.orderIndex !== null) {
      return 1; // b comes first
    }

    // Then sort by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Builds a hierarchical tree structure from flat items
 */
function buildHierarchy(
  items: DataroomItem[],
  parentId: string | null = null,
): HierarchicalItem[] {
  const children = items.filter((item) => {
    if (item.type === "folder") {
      return item.parentId === parentId;
    } else {
      return item.folderId === parentId;
    }
  });

  const sortedChildren = sortItems(children);

  return sortedChildren.map((item, index) => {
    const hierarchicalItem: HierarchicalItem = {
      ...item,
      hierarchicalIndex: "", // Will be set later
      children: buildHierarchy(items, item.id),
    };

    return hierarchicalItem;
  });
}

/**
 * Assigns hierarchical indexes to items recursively
 */
function assignHierarchicalIndexes(
  items: HierarchicalItem[],
  prefix: string = "",
): void {
  items.forEach((item, index) => {
    const currentIndex = index + 1;
    item.hierarchicalIndex = prefix
      ? `${prefix}.${currentIndex}`
      : `${currentIndex}`;

    if (item.children.length > 0) {
      assignHierarchicalIndexes(item.children, item.hierarchicalIndex);
    }
  });
}

/**
 * Flattens the hierarchical tree back to a flat array with hierarchical indexes
 */
function flattenHierarchy(items: HierarchicalItem[]): Array<{
  id: string;
  hierarchicalIndex: string;
  type: "folder" | "document";
}> {
  const result: Array<{
    id: string;
    hierarchicalIndex: string;
    type: "folder" | "document";
  }> = [];

  items.forEach((item) => {
    result.push({
      id: item.id,
      hierarchicalIndex: item.hierarchicalIndex,
      type: item.type,
    });

    if (item.children.length > 0) {
      result.push(...flattenHierarchy(item.children));
    }
  });

  return result;
}

/**
 * Calculates and updates hierarchical indexes for all folders and documents in a dataroom
 */
export async function calculateAndUpdateHierarchicalIndexes(
  dataroomId: string,
): Promise<{ foldersUpdated: number; documentsUpdated: number }> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        // Consistent snapshot of folders and documents
        const folders = await tx.dataroomFolder.findMany({
          where: { dataroomId },
          select: {
            id: true,
            name: true,
            parentId: true,
            orderIndex: true,
          },
        });
        const documents = await tx.dataroomDocument.findMany({
          where: { dataroomId },
          select: {
            id: true,
            folderId: true,
            orderIndex: true,
            document: {
              select: {
                name: true,
              },
            },
          },
        });

        // Convert to unified format
        const allItems: DataroomItem[] = [
          ...folders.map((folder) => ({
            id: folder.id,
            name: folder.name,
            orderIndex: folder.orderIndex,
            parentId: folder.parentId,
            type: "folder" as const,
          })),
          ...documents.map((doc) => ({
            id: doc.id,
            name: doc.document.name,
            orderIndex: doc.orderIndex,
            folderId: doc.folderId,
            type: "document" as const,
          })),
        ];

        // Build hierarchy starting from root items (no parent)
        const hierarchy = buildHierarchy(allItems, null);

        // Assign hierarchical indexes
        assignHierarchicalIndexes(hierarchy);

        // Flatten back to get all items with their indexes
        const flattenedItems = flattenHierarchy(hierarchy);

        // Separate folders and documents for batch updates
        const folderUpdates = flattenedItems.filter(
          (item) => item.type === "folder",
        );
        const documentUpdates = flattenedItems.filter(
          (item) => item.type === "document",
        );

        // Batched updates to reduce open query fan-out
        const BATCH = 200;
        for (let i = 0; i < folderUpdates.length; i += BATCH) {
          const chunk = folderUpdates.slice(i, i + BATCH);
          for (const f of chunk) {
            await tx.dataroomFolder.update({
              where: { id: f.id },
              data: { hierarchicalIndex: f.hierarchicalIndex },
            });
          }
        }
        for (let i = 0; i < documentUpdates.length; i += BATCH) {
          const chunk = documentUpdates.slice(i, i + BATCH);
          for (const d of chunk) {
            await tx.dataroomDocument.update({
              where: { id: d.id },
              data: { hierarchicalIndex: d.hierarchicalIndex },
            });
          }
        }

        return {
          foldersUpdated: folderUpdates.length,
          documentsUpdated: documentUpdates.length,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  } catch (error) {
    console.error(
      "Error calculating hierarchical indexes for",
      dataroomId,
      error,
    );
    throw new Error("Failed to calculate and update hierarchical indexes");
  }
}
