import { NextApiRequest, NextApiResponse } from "next";

import { sendConversationNotification } from "@/ee/features/conversations/emails/lib/send-conversation-notification";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";
import { generateUnsubscribeUrl } from "@/lib/utils/unsubscribe";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  // Extract the API Key from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1]; // Assuming the format is "Bearer [token]"

  // Check if the API Key matches
  if (token !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const {
    linkUrl,
    conversationId,
    dataroomId,
    viewerId,
    senderUserId,
    teamId,
  } = req.body as {
    linkUrl: string;
    conversationId: string;
    dataroomId: string;
    viewerId: string;
    senderUserId: string;
    teamId: string;
  };

  let viewer: { email: string } | null = null;

  try {
    // Find the viewer
    viewer = await prisma.viewer.findUnique({
      where: {
        id: viewerId,
        teamId,
      },
      select: {
        email: true,
      },
    });

    if (!viewer) {
      res.status(404).json({ message: "Viewer not found." });
      return;
    }
  } catch (error) {
    log({
      message: `Failed to find viewer for viewerId: ${viewerId}. \n\n Error: ${error}`,
      type: "error",
      mention: true,
    });
    res.status(500).json({ message: (error as Error).message });
    return;
  }

  // POST /api/jobs/send-conversation-new-message-notification
  try {
    // Fetch the conversation to verify the settings
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        dataroomId: dataroomId,
        teamId: teamId,
      },
      select: {
        title: true,
        dataroom: {
          select: {
            name: true,
          },
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: senderUserId },
      select: { email: true },
    });

    if (!user) {
      res.status(404).json({ message: "Sender not found." });
      return;
    }

    const unsubscribeUrl = generateUnsubscribeUrl({
      viewerId,
      dataroomId,
      teamId,
    });

    await sendConversationNotification({
      conversationTitle: conversation?.title || "",
      dataroomName: conversation?.dataroom?.name || "",
      senderEmail: user.email!,
      to: viewer.email!,
      url: linkUrl,
      unsubscribeUrl,
    });

    res.status(200).json({
      message: "Successfully sent dataroom change notification",
      viewerId,
    });
    return;
  } catch (error) {
    log({
      message: `Failed to send invite email for dataroom ${dataroomId} to viewer: ${viewerId}. \n\n Error: ${error} \n\n*Metadata*: \`{dataroomId: ${dataroomId}, viewerId: ${viewerId}}\``,
      type: "error",
      mention: true,
    });
    return res.status(500).json({ message: (error as Error).message });
  }
}
