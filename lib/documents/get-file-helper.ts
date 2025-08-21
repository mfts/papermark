import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";

export const getFileForDocumentPage = async (
  pageNumber: number,
  documentId: string,
  versionNumber?: number,
): Promise<string> => {
  // Validate input parameters
  if (!documentId || typeof documentId !== "string") {
    throw new Error("Invalid document ID provided");
  }

  if (!pageNumber || pageNumber < 1) {
    throw new Error("Invalid page number provided");
  }

  const documentVersions = await prisma.documentVersion.findMany({
    where: {
      documentId: documentId,
      ...(versionNumber
        ? { versionNumber: versionNumber }
        : { isPrimary: true }),
    },
    select: {
      id: true,
      versionNumber: true,
    },
    orderBy: {
      versionNumber: "desc",
    },
    take: 1,
  });

  if (documentVersions.length === 0) {
    throw new Error(
      `Document version not found for document ${documentId}${versionNumber ? ` version ${versionNumber}` : " (primary version)"}`,
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
    // Check if the document version exists but the page doesn't (document might still be processing)
    const versionExists = await prisma.documentVersion.findUnique({
      where: { id: documentVersion.id },
      select: {
        id: true,
        hasPages: true,
        _count: {
          select: { pages: true },
        },
      },
    });

    if (versionExists && versionExists._count.pages === 0) {
      throw new Error(
        `Document is still processing. Page ${pageNumber} not available yet for document ${documentId}`,
      );
    }

    throw new Error(
      `Page ${pageNumber} not found for document ${documentId} version ${documentVersion.versionNumber}`,
    );
  }

  try {
    return await getFile({
      type: documentPage.storageType,
      data: documentPage.file,
    });
  } catch (error) {
    throw new Error(
      `Failed to retrieve file for page ${pageNumber} of document ${documentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
