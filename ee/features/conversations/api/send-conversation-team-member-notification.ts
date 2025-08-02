import { NextApiRequest, NextApiResponse } from "next";

import { sendConversationNotification } from "@/ee/features/conversations/emails/lib/send-conversation-notification";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

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
    conversationId,
    dataroomId,
    userId,
    senderUserId,
    teamId,
  } = req.body as {
    conversationId: string;
    dataroomId: string;
    userId: string;
    senderUserId: string;
    teamId: string;
  };

  let user: { email: string } | null = null;

  try {
    // Find the team member
    user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "Team member not found." });
      return;
    }

    // Verify the user is actually a team member with appropriate role
    const userTeam = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      select: {
        role: true,
        blockedAt: true,
        notificationPreferences: true,
      },
    });

    if (!userTeam || userTeam.blockedAt || !["ADMIN", "MANAGER"].includes(userTeam.role)) {
      res.status(403).json({ message: "User is not an active team member with notification permissions." });
      return;
    }

    // Check if team member has disabled conversation notifications
    // (This could be extended in the future to support more granular preferences)
    if (userTeam.notificationPreferences) {
      try {
        const preferences = userTeam.notificationPreferences as any;
        if (preferences.conversations === false) {
          res.status(200).json({
            message: "Team member has disabled conversation notifications",
            userId,
          });
          return;
        }
      } catch (error) {
        // If preferences parsing fails, continue with sending notification
      }
    }
  } catch (error) {
    log({
      message: `Failed to find team member for userId: ${userId}. \n\n Error: ${error}`,
      type: "error",
      mention: true,
    });
    res.status(500).json({ message: (error as Error).message });
    return;
  }

  // POST /api/jobs/send-conversation-team-member-notification
  try {
    // Fetch the conversation and dataroom information
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

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found." });
      return;
    }

    const sender = await prisma.user.findUnique({
      where: { id: senderUserId },
      select: { email: true },
    });

    if (!sender) {
      res.status(404).json({ message: "Sender not found." });
      return;
    }

    // Generate the URL for team members to access the conversation
    const conversationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/datarooms/${dataroomId}/conversations/${conversationId}`;

    // For team members, provide a generic unsubscribe URL to team settings
    // TODO: Implement team member specific unsubscribe functionality
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/settings/notifications`;

    await sendConversationNotification({
      conversationTitle: conversation.title || "",
      dataroomName: conversation.dataroom?.name || "",
      senderEmail: sender.email!,
      to: user.email!,
      url: conversationUrl,
      unsubscribeUrl,
    });

    res.status(200).json({
      message: "Successfully sent conversation notification to team member",
      userId,
    });
    return;
  } catch (error) {
    log({
      message: `Failed to send conversation notification for dataroom ${dataroomId} to team member: ${userId}. \n\n Error: ${error} \n\n*Metadata*: \`{dataroomId: ${dataroomId}, userId: ${userId}}\``,
      type: "error",
      mention: true,
    });
    return res.status(500).json({ message: (error as Error).message });
  }
}