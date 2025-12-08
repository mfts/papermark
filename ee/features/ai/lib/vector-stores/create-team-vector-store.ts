import { openai } from "@/ee/features/ai/lib/models/openai";

/**
 * Create a vector store for a team
 * @param teamId - The team ID
 * @param name - The team name
 * @returns The vector store ID
 */
export async function createTeamVectorStore(
  teamId: string,
  name: string,
): Promise<string> {
  try {
    const vectorStore = await openai.vectorStores.create({
      name: `Team: ${name}`,
      metadata: {
        teamId,
        type: "team",
      },
    });

    return vectorStore.id;
  } catch (error) {
    console.error("Error creating team vector store:", error);
    throw new Error("Failed to create team vector store");
  }
}
