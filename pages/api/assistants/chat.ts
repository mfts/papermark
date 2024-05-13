import { Ratelimit } from "@upstash/ratelimit";
import { experimental_AssistantResponse } from "ai";
import { type MessageContentText } from "openai/resources/beta/threads/messages/messages";
import { type Run } from "openai/resources/beta/threads/runs/runs";

import { openai } from "@/lib/openai";
import { redis } from "@/lib/redis";

const ratelimit = {
  public: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:public",
    // rate limit public to 3 request per hour
    limiter: Ratelimit.slidingWindow(3, "1h"),
  }),
  free: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:free",
    // rate limit to 3 request per day
    limiter: Ratelimit.fixedWindow(3, "24h"),
  }),
  paid: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:paid",
    limiter: Ratelimit.slidingWindow(60, "10s"),
  }),
  pro: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:pro",
    // rate limit to 1000 request per 30 days
    limiter: Ratelimit.fixedWindow(1000, "30d"),
  }),
};

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
    userId: string | null;
    plan: string | null;
  } = await req.json();

  if (input.isPublic) {
    const ip = req.headers.get("x-forwarded-for");

    const { success, limit, reset, remaining } = await ratelimit.public.limit(
      `ratelimit_${ip}`,
    );

    if (!success) {
      return new Response("You have reached your request limit for the day.", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  if (input.userId && input.plan !== "pro") {
    const { success, limit, reset, remaining } = await ratelimit.free.limit(
      `ratelimit_${input.userId}`,
    );

    if (!success) {
      return new Response("You have reached your request limit for the day.", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

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

      async function waitForRun(run: Run) {
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
