import { openai } from "@/ee/features/ai/lib/models/openai";

interface VectorStoreFile {
  id: string;
  object: string;
  created_at: number;
  vector_store_id: string;
  status: string;
}

/**
 * Get all files in a vector store
 * @param vectorStoreId - The vector store ID
 * @returns Array of vector store files
 */
export async function getVectorStoreFiles(
  vectorStoreId: string,
): Promise<VectorStoreFile[]> {
  try {
    const files = await openai.vectorStores.files.list(vectorStoreId);
    return files.data as VectorStoreFile[];
  } catch (error) {
    console.error("Error getting vector store files:", error);
    throw new Error("Failed to get vector store files");
  }
}
