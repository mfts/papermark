import { NextApiRequest, NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import { openai } from "@/lib/openai";
import prisma from "@/lib/prisma";
import { convertThreadMessagesToMessages } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // TODO: block unauthorized requests

    const { documentId, userId } = req.body as {
      documentId: string;
      userId: string;
    };

    try {
      let chat;
      chat = await prisma.chat.findUnique({
        where: {
          userId_documentId: {
            userId,
            documentId,
          },
        },
        select: {
          threadId: true,
        },
      });

      if (!chat) {
        // get fileId from document version
        const documentVersion = await prisma.documentVersion.findFirst({
          where: {
            documentId,
            isPrimary: true,
          },
          select: {
            fileId: true,
          },
        });

        const threadId = (
          await openai.beta.threads.create({
            messages: [
              {
                role: "user",
                content: "Initializing chat with Papermark Assistant",
                file_ids: [documentVersion?.fileId || ""],
                metadata: { intitialMessage: true },
              },
            ],
          })
        ).id;

        chat = await prisma.chat.create({
          data: {
            userId,
            threadId,
            documentId,
          },
          select: {
            threadId: true,
          },
        });
      }

      const threadId = chat.threadId;
      // get existing messages from thread, latest first (DESC)
      const { data } = await openai.beta.threads.messages.list(threadId);

      return res.status(200).json({
        ...chat,
        messages: convertThreadMessagesToMessages(data),
      });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET and DELETE requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
