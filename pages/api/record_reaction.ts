import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";
import { notifyDocumentReaction } from "@/lib/slack/events";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  // POST /api/record_reaction

  const { viewId, pageNumber, type } = req.body as {
    viewId: string;
    pageNumber: number;
    type: string;
  };

  try {
    const reaction = await prisma.reaction.create({
      data: {
        viewId,
        pageNumber,
        type,
      },
      include: {
        view: {
          select: {
            documentId: true,
            dataroomId: true,
            linkId: true,
            viewerEmail: true,
            viewerId: true,
            teamId: true,
          },
        },
      },
    });

    if (!reaction) {
      res.status(500).json({ message: "Internal Server Error" });
      return;
    }

    if (reaction.view.teamId) {
      try {
        await notifyDocumentReaction({
          teamId: reaction.view.teamId,
          documentId: reaction.view.documentId ?? undefined,
          dataroomId: reaction.view.dataroomId ?? undefined,
          linkId: reaction.view.linkId ?? undefined,
          viewerEmail: reaction.view.viewerEmail ?? undefined,
          viewerId: reaction.view.viewerId ?? undefined,
          metadata: {
            reaction: type,
            pageNumber: pageNumber,
          },
        });
      } catch (error) {
        console.error("Error sending Slack notification:", error);
      }
    }

    res.status(200).json({ message: "Reaction recorded" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
}
