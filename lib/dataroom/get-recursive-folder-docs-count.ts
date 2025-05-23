import { PrismaClient } from "@prisma/client";

/**
 * Recursively counts the total number of documents and child folders within a folder and all its descendants.
 *
 * @param folderId - The ID of the root folder to start counting from.
 * @returns An object containing the total counts of documents and child folders within the specified folder and all nested subfolders.
 */
export async function getRecursiveFolderCounts(db: PrismaClient, folderId: string) {
  const folder = await db.dataroomFolder.findUnique({
    where: { id: folderId },
    include: {
      documents: true,
      childFolders: true,
    },
  });

  if (!folder) return { documents: 0, childFolders: 0 };

  let totalDocuments = folder.documents.length;
  let totalChildFolders = folder.childFolders.length;

  for (const childFolder of folder.childFolders) {
    const childCounts = await getRecursiveFolderCounts(db, childFolder.id);
    totalDocuments += childCounts.documents;
    totalChildFolders += childCounts.childFolders;
  }

  return {
    documents: totalDocuments,
    childFolders: totalChildFolders,
  };
}