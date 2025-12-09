import { openai } from "@/ee/features/ai/lib/models/openai";

interface VectorStoreFileOptions {
  vectorStoreId: string;
  fileId: string;
  metadata: {
    teamId: string;
    documentId: string;
    documentName: string;
    versionId: string;
    folderId?: string;
    dataroomId?: string;
    dataroomDocumentId?: string;
    dataroomFolderId?: string;
  };
}

/**
 * Upload a file to a vector store
 * @param options - Vector store file options including vector store ID, file ID, and metadata
 * @returns The vector store file ID
 */
export async function addFileToVectorStore({
  vectorStoreId,
  fileId,
  metadata,
}: VectorStoreFileOptions): Promise<string> {
  try {
    // Add file to vector store with metadata
    const vectorStoreFile = await openai.vectorStores.files.create(
      vectorStoreId,
      {
        file_id: fileId,
        attributes: metadata,
      },
    );

    return vectorStoreFile.id;
  } catch (error) {
    console.error("Error adding file to vector store:", error);
    throw new Error("Failed to add file to vector store");
  }
}
