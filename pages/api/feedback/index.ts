import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // POST /api/feedback
    const { answer, feedbackId, viewId } = req.body as {
      answer: string;
      feedbackId: string;
      viewId: string;
    };

    try {
      const feedback = await prisma.feedback.findUnique({
        where: {
          id: feedbackId,
        },
        select: {
          linkId: true,
          data: true,
        },
      });

      // if feedback does not exist, we should not record any response
      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      const view = await prisma.view.findUnique({
        where: {
          id: viewId,
          linkId: feedback.linkId,
        },
      });

      // if view does not exist, we should not record any response
      if (!view) {
        return res.status(404).json({ error: "View not found" });
      }

      // create a feedback response
      await prisma.feedbackResponse.create({
        data: {
          feedbackId: feedbackId,
          viewId: viewId,
          data: {
            ...(feedback.data as { question: string; type: string }),
            answer: answer,
          },
        },
      });

      return res.status(200).json({ message: "Feedback response recorded" });
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  }

  // We only allow POST requests
  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
