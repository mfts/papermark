import { openai } from "@/ee/features/ai/lib/models/openai";

/**
 * Delete a vector store
 * @param vectorStoreId - The vector store ID to delete
 */
export async function deleteVectorStore(vectorStoreId: string): Promise<void> {
  try {
    await openai.vectorStores.delete(vectorStoreId);
  } catch (error) {
    console.error("Error deleting vector store:", error);
    throw new Error("Failed to delete vector store");
  }
}
