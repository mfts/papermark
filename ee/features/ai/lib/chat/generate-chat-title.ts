import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Generate a chat title from the first message
 * @param firstMessage - The first user message
 * @returns Generated title
 */
export async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    // Limit message length for title generation
    const truncatedMessage = firstMessage.slice(0, 200);

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Generate a short, descriptive title (max 6 words) for a chat that starts with this message: "${truncatedMessage}". Only return the title, nothing else.`,
      providerOptions: {
        openai: {
          maxOutputTokens: 20,
        },
      },
    });

    // Clean up the title
    const title = text
      .trim()
      .replace(/^["']|["']$/g, "") // Remove quotes
      .slice(0, 60); // Max 60 chars

    return title;
  } catch (error) {
    console.error("Error generating chat title:", error);
    // Return a default title based on first few words
    return firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
  }
}
