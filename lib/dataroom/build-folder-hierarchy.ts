import slugify from "@sindresorhus/slugify";

export interface FolderInput {
  id: string;
  name: string;
  parentId: string | null;
}

/**
 * Builds a map of folder ID -> computed path based on the parentId hierarchy.
 *
 * This ensures the download folder structure matches what the UI shows
 * (which uses parentId to build the tree), rather than relying on the
 * materialized `path` field which can become stale after renames/moves.
 *
 * @param folders - Array of folders with id, name, and parentId
 * @returns Map of folderId -> computed slugified path (e.g., "/02-company-background/docs")
 */
export function buildFolderPathsFromHierarchy(
  folders: FolderInput[],
): Map<string, string> {
  const folderById = new Map(folders.map((f) => [f.id, f]));
  const pathCache = new Map<string, string>();

  function computePath(folderId: string, visited: Set<string>): string {
    if (pathCache.has(folderId)) return pathCache.get(folderId)!;

    // Prevent infinite loops from circular parentId references
    if (visited.has(folderId)) {
      const folder = folderById.get(folderId);
      const fallbackPath = `/${slugify(folder?.name ?? folderId)}`;
      pathCache.set(folderId, fallbackPath);
      return fallbackPath;
    }
    visited.add(folderId);

    const folder = folderById.get(folderId);
    if (!folder) return "";

    let parentPath = "";
    if (folder.parentId && folderById.has(folder.parentId)) {
      parentPath = computePath(folder.parentId, visited);
    }

    const path = `${parentPath}/${slugify(folder.name)}`;
    pathCache.set(folderId, path);
    return path;
  }

  for (const folder of folders) {
    computePath(folder.id, new Set());
  }

  return pathCache;
}

/**
 * Builds a folder name map from computed paths.
 * Maps computedPath -> { name, id } for looking up display names.
 */
export function buildFolderNameMap(
  folders: FolderInput[],
  pathMap: Map<string, string>,
): Map<string, { name: string; id: string }> {
  const nameMap = new Map<string, { name: string; id: string }>();
  for (const folder of folders) {
    const computedPath = pathMap.get(folder.id);
    if (computedPath) {
      nameMap.set(computedPath, { name: folder.name, id: folder.id });
    }
  }
  return nameMap;
}
