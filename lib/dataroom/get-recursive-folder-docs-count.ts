import { PrismaClient } from "@prisma/client";

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