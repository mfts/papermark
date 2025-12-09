import { openai } from "@/ee/features/ai/lib/models/openai";
import { type OpenAI } from "openai";

/**
 * Get information about a vector store
 * @param vectorStoreId - The vector store ID
 * @returns Vector store information
 */
export async function getVectorStoreInfo(
  vectorStoreId: string,
): Promise<OpenAI.VectorStores.VectorStore> {
  try {
    const vectorStore = await openai.vectorStores.retrieve(vectorStoreId);
    return vectorStore;
  } catch (error) {
    console.error("Error getting vector store info:", error);
    throw new Error("Failed to get vector store info");
  }
}
