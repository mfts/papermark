import { experimental_AssistantResponse } from "ai";
import OpenAI from "openai";
import { type MessageContentText } from "openai/resources/beta/threads/messages/messages";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const config = {
  runtime: "edge",
};

export default async function POST(req: Request) {
  // Parse the request body
  const input: {
    threadId: string | null;
    message: string;
    isPublic: boolean | null;
  } = await req.json();

  // create a threadId if one wasn't provided
  const threadId = input.threadId ?? (await openai.beta.threads.create()).id;

  // Add a message to the thread
  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: input.message,
  });

  // select the assistantId based on the isPublic flag
  const assistantId = input.isPublic
    ? (process.env.OAI_PUBLIC_ASSISTANT_ID as string)
    : (process.env.OAI_ASSISTANT_ID as string);

  return experimental_AssistantResponse(
    {
      threadId,
      messageId: createdMessage.id,
    },
    async ({ threadId, sendMessage }) => {
      // Run the assistant on the thread
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId!,
      });

      async function waitForRun(run: OpenAI.Beta.Threads.Runs.Run) {
        // Poll for status change
        while (run.status === "queued" || run.status === "in_progress") {
          // delay for 500ms:
          await new Promise((resolve) => setTimeout(resolve, 500));

          run = await openai.beta.threads.runs.retrieve(threadId!, run.id);
        }

        // Check the run status
        if (
          run.status === "cancelled" ||
          run.status === "cancelling" ||
          run.status === "failed" ||
          run.status === "expired"
        ) {
          throw new Error(run.status);
        }
      }

      await waitForRun(run);

      // Get new thread messages (after our message)
      const responseMessages = (
        await openai.beta.threads.messages.list(threadId, {
          after: createdMessage.id,
          order: "asc",
        })
      ).data;

      // Send the messages
      for (const message of responseMessages) {
        sendMessage({
          id: message.id,
          role: "assistant",
          content: message.content.filter(
            (content) => content.type === "text",
          ) as Array<MessageContentText>,
        });
      }
    },
  );
}
