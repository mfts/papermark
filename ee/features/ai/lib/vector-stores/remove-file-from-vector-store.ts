import { openai } from "@/ee/features/ai/lib/models/openai";

/**
 * Remove a file from a vector store
 * @param vectorStoreId - The vector store ID
 * @param fileId - The file ID to remove
 */
export async function removeFileFromVectorStore(
  vectorStoreId: string,
  fileId: string,
): Promise<void> {
  try {
    await openai.vectorStores.files.delete(fileId, {
      vector_store_id: vectorStoreId,
    });
  } catch (error) {
    console.error("Error removing file from vector store:", error);
    throw new Error("Failed to remove file from vector store");
  }
}
