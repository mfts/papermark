import { DataroomFolder, DataroomDocument } from "@prisma/client";

export type FolderOrDocumentWithIndex = {
  id: string;
  name: string;
  orderIndex: number | null;
  itemType: "folder" | "document";
  parentId?: string | null;
  folderId?: string | null;
  path?: string;
};

/**
 * Calculates hierarchical index numbers for folders and documents
 * Returns a map of item ID to index string (e.g., "1", "2.1", "2.2", "3")
 */
export function calculateHierarchicalIndexes(
  items: FolderOrDocumentWithIndex[],
  folders: DataroomFolder[]
): Map<string, string> {
  const indexMap = new Map<string, string>();
  
  // Create a map of folder ID to folder for quick lookup
  const folderMap = new Map(folders.map(folder => [folder.id, folder]));
  
  // Sort items by orderIndex, then by name
  const sortedItems = [...items].sort((a, b) => {
    if (a.orderIndex !== null && b.orderIndex !== null) {
      return a.orderIndex - b.orderIndex;
    }
    if (a.orderIndex !== null && b.orderIndex === null) {
      return -1;
    }
    if (a.orderIndex === null && b.orderIndex !== null) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });

  // Build hierarchy structure
  const hierarchy = new Map<string | null, FolderOrDocumentWithIndex[]>();
  
  for (const item of sortedItems) {
    const parentKey = item.itemType === "folder" ? item.parentId : item.folderId;
    if (!hierarchy.has(parentKey)) {
      hierarchy.set(parentKey, []);
    }
    hierarchy.get(parentKey)!.push(item);
  }

  // Recursive function to assign indexes
  function assignIndexes(parentId: string | null, parentIndex: string = ""): void {
    const children = hierarchy.get(parentId) || [];
    
    children.forEach((item, index) => {
      const currentNumber = index + 1;
      const currentIndex = parentIndex 
        ? `${parentIndex}.${currentNumber}` 
        : `${currentNumber}`;
      
      indexMap.set(item.id, currentIndex);
      
      // If this is a folder, recursively process its children
      if (item.itemType === "folder") {
        assignIndexes(item.id, currentIndex);
      }
    });
  }

  // Start the recursive assignment from root level
  assignIndexes(null);
  
  return indexMap;
}

/**
 * Get the index number for a specific item
 */
export function getItemIndex(
  itemId: string,
  items: FolderOrDocumentWithIndex[],
  folders: DataroomFolder[]
): string {
  const indexMap = calculateHierarchicalIndexes(items, folders);
  return indexMap.get(itemId) || "";
}