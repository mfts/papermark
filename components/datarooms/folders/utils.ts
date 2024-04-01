import { DataroomFolderWithDocuments } from "@/lib/swr/use-dataroom";

// Helper function to build nested folder structure
export const buildNestedFolderStructure = (
  folders: DataroomFolderWithDocuments[],
) => {
  const folderMap = new Map();

  // Initialize every folder with an additional childFolders property
  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, childFolders: [] });
  });

  const rootFolders: DataroomFolderWithDocuments[] = [];

  folderMap.forEach((folder, id) => {
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId);
      parent.childFolders.push(folder);
    } else {
      rootFolders.push(folder);
    }
  });

  return rootFolders;
};
