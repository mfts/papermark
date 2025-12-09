import prisma from "@/lib/prisma";

interface DocumentMetadata {
  documentId: string;
  documentName: string;
  versionId: string;
  dataroomId?: string;
  folderId?: string;
  teamId: string;
}

/**
 * Extract metadata from a document for vector store tagging
 * @param documentId - The document ID
 * @param versionId - The document version ID
 * @returns Document metadata
 */
export async function extractDocumentMetadata(
  documentId: string,
  versionId: string,
): Promise<DocumentMetadata> {
  try {
    const documentVersion = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        document: {
          include: {
            datarooms: {
              include: {
                dataroom: true,
                folder: true,
              },
            },
          },
        },
      },
    });

    if (!documentVersion) {
      throw new Error("Document version not found");
    }

    const document = documentVersion.document;

    // Get dataroom and folder info if document is in a dataroom
    const dataroomDocument = document.datarooms[0]; // Get first dataroom association

    const metadata: DocumentMetadata = {
      documentId: document.id,
      documentName: document.name,
      versionId: documentVersion.id,
      teamId: document.teamId,
      dataroomId: dataroomDocument?.dataroomId,
      folderId: dataroomDocument?.folderId || document.folderId || undefined,
    };

    return metadata;
  } catch (error) {
    console.error("Error extracting document metadata:", error);
    throw new Error("Failed to extract document metadata");
  }
}

