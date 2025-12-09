import { openai } from "@/ee/features/ai/lib/models/openai";

/**
 * Create a vector store for a dataroom
 * @param dataroomId - The dataroom ID
 * @param teamId - The team ID
 * @param name - The name of the vector store
 * @returns The vector store ID
 */
export async function createDataroomVectorStore({
  dataroomId,
  teamId,
  name,
}: {
  dataroomId: string;
  teamId: string;
  name: string;
}): Promise<string> {
  try {
    const vectorStore = await openai.vectorStores.create({
      name: `Dataroom: ${name}`,
      metadata: {
        dataroomId,
        teamId,
        type: "dataroom",
      },
    });

    return vectorStore.id;
  } catch (error) {
    console.error("Error creating dataroom vector store:", error);
    throw new Error("Failed to create dataroom vector store");
  }
}
