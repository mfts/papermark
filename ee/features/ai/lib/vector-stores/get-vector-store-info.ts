import { openai } from "@/ee/features/ai/lib/models/openai";

interface VectorStoreInfo {
  id: string;
  name: string;
  file_counts: {
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
    total: number;
  };
  created_at: number;
  metadata: Record<string, string>;
}

/**
 * Get information about a vector store
 * @param vectorStoreId - The vector store ID
 * @returns Vector store information
 */
export async function getVectorStoreInfo(
  vectorStoreId: string,
): Promise<VectorStoreInfo> {
  try {
    const vectorStore = await openai.vectorStores.retrieve(vectorStoreId);
    return vectorStore as VectorStoreInfo;
  } catch (error) {
    console.error("Error getting vector store info:", error);
    throw new Error("Failed to get vector store info");
  }
}
