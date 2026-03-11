import { DataroomDocument, DataroomFolder } from "@prisma/client";

import { DataroomFolderWithDocuments } from "@/lib/swr/use-dataroom";

/**
 * Detect folder IDs that participate in a parentId cycle (e.g. A→B→A).
 * Only the folders forming the loop itself are returned; descendants
 * whose ancestors happen to be in the cycle are NOT included.
 */
function detectFolderCycles(
  folderMap: Map<string, { id: string; parentId: string | null }>,
): Set<string> {
  const inCycle = new Set<string>();
  for (const [, folder] of folderMap) {
    const path: string[] = [];
    const pathSet = new Set<string>();
    let current: string | null = folder.id;
    while (current) {
      if (pathSet.has(current)) {
        const cycleStart = path.indexOf(current);
        for (let i = cycleStart; i < path.length; i++) {
          inCycle.add(path[i]);
        }
        break;
      }
      path.push(current);
      pathSet.add(current);
      const f = folderMap.get(current);
      if (!f?.parentId) break;
      current = f.parentId;
    }
  }
  return inCycle;
}

/**
 * Build a cycle-safe nested tree. Folders in a cycle are excluded;
 * their non-cycle children are promoted to root level.
 */
function buildSafeTree<T extends { parentId: string | null }>(
  folderMap: Map<string, T & { childFolders: T[] }>,
): (T & { childFolders: T[] })[] {
  const folderInCycle = detectFolderCycles(folderMap);
  const rootFolders: (T & { childFolders: T[] })[] = [];

  folderMap.forEach((folder, id) => {
    if (folderInCycle.has(id)) return;
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId);
      if (parent && !folderInCycle.has(folder.parentId)) {
        parent.childFolders.push(folder);
      } else {
        rootFolders.push(folder);
      }
    } else {
      rootFolders.push(folder);
    }
  });

  return rootFolders;
}

// Helper function to build nested folder structure
export const buildNestedFolderStructure = (
  folders: DataroomFolderWithDocuments[],
) => {
  const folderMap = new Map<
    string,
    DataroomFolderWithDocuments & { childFolders: DataroomFolderWithDocuments[] }
  >();

  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, childFolders: [] });
  });

  return buildSafeTree(folderMap);
};

export const buildNestedFolderStructureWithDocs = (
  folders: DataroomFolder[],
  documents: DataroomDocumentWithVersion[],
) => {
  const folderMap = new Map<string, DataroomFolderWithDocumentsNew>();

  folders.forEach((folder) => {
    folderMap.set(folder.id, {
      ...folder,
      documents: documents.filter((doc) => doc.folderId === folder.id),
      childFolders: [],
    });
  });

  return buildSafeTree(folderMap);
};

type DataroomDocumentWithVersion = {
  dataroomDocumentId: string;
  folderId: string | null;
  id: string;
  name: string;
  hierarchicalIndex: string | null;
  versions: {
    id: string;
    versionNumber: number;
    hasPages: boolean;
  }[];
};

type DataroomFolderWithDocumentsNew = DataroomFolder & {
  childFolders: DataroomFolderWithDocumentsNew[];
  documents: {
    dataroomDocumentId: string;
    folderId: string | null;
    id: string;
    name: string;
    hierarchicalIndex: string | null;
  }[];
};

export const itemsMessage = (
  documentsToMove: string[],
  foldersToMove: string[],
  action: "Moving" | "Successfully moved",
) => {
  const docCount = documentsToMove.length;
  const folderCount = foldersToMove.length;

  if (docCount && folderCount) {
    return `${action} ${docCount} document${docCount > 1 ? "s" : ""} and ${folderCount} folder${folderCount > 1 ? "s" : ""}...`;
  }
  if (docCount) {
    return `${action} ${docCount} document${docCount > 1 ? "s" : ""}...`;
  }
  if (folderCount) {
    return `${action} ${folderCount} folder${folderCount > 1 ? "s" : ""}...`;
  }
  return `${action} items...`;
};
