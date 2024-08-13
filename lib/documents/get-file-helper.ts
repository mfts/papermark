import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";

export const getFileForDocumentPage = async (
  pageNumber: number,
  documentId: string,
  versionNumber?: number,
): Promise<string> => {
  const documentVersions = await prisma.documentVersion.findMany({
    where: {
      documentId: documentId,
      ...(versionNumber
        ? { versionNumber: versionNumber }
        : { isPrimary: true }),
    },
    select: {
      id: true,
    },
    orderBy: {
      versionNumber: "desc",
    },
    take: 1,
  });

  if (documentVersions.length === 0) {
    throw new Error(
      `Latest document version from document id ${documentId} with document id ${documentId} not found`,
    );
  }

  const documentVersion = documentVersions[0];

  const documentPage = await prisma.documentPage.findUnique({
    where: {
      pageNumber_versionId: {
        pageNumber: pageNumber,
        versionId: documentVersion.id,
      },
    },
    select: {
      file: true,
      storageType: true,
    },
  });

  if (!documentPage) {
    throw new Error(
      `Document page ${pageNumber} with version id ${documentId} not found`,
    );
  }

  return getFile({
    type: documentPage.storageType,
    data: documentPage.file,
  });
};
