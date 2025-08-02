import { NextApiRequest, NextApiResponse } from "next";

import { sendConversationTeamNotification } from "@/ee/features/conversations/emails/lib/send-conversation-team-notification";
import { z } from "zod";

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

  // Define validation schema
  const requestSchema = z.object({
    conversationId: z
      .string()
      .min(1, "conversationId is required and must be a non-empty string"),
    dataroomId: z
      .string()
      .min(1, "dataroomId is required and must be a non-empty string"),
    senderUserId: z
      .string()
      .min(1, "senderUserId is required and must be a non-empty string"),
    teamId: z
      .string()
      .min(1, "teamId is required and must be a non-empty string"),
  });

  // Validate request body
  const validationResult = requestSchema.safeParse(req.body);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    res.status(400).json({
      message: firstError.message,
      field: firstError.path[0],
    });
    return;
  }

  const { conversationId, dataroomId, senderUserId, teamId } =
    validationResult.data;

  try {
    // Get all team members (ADMIN/MANAGER) for this team
    const teamMembers = await prisma.userTeam.findMany({
      where: {
        teamId,
        role: {
          in: ["ADMIN", "MANAGER"],
        },
        // Only active team members (not blocked)
        blockedAt: null,
      },
      select: {
        userId: true,
        notificationPreferences: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!teamMembers || teamMembers.length === 0) {
      res.status(200).json({
        message: "No team members found for notifications",
        notified: 0,
      });
      return;
    }

    // Filter out team members who have disabled conversation notifications
    const eligibleTeamMembers = teamMembers.filter((teamMember) => {
      if (teamMember.notificationPreferences) {
        try {
          const preferences = teamMember.notificationPreferences as {
            conversations?: boolean;
          };
          if (preferences.conversations === false) {
            return false;
          }
        } catch (error) {
          // If preferences parsing fails, include the team member
        }
      }
      return teamMember.user.email; // Only include if they have an email
    });

    if (eligibleTeamMembers.length === 0) {
      res.status(200).json({
        message: "No eligible team members for notifications",
        notified: 0,
      });
      return;
    }

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

    // First try to find as a user
    const userSender = await prisma.viewer.findUnique({
      where: { id: senderUserId },
      select: { email: true },
    });

    let senderEmail = "";
    if (userSender) {
      senderEmail = userSender.email;
    } else {
      senderEmail = "Unknown sender";
    }

    // Generate the URL for team members to access the conversation
    const conversationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/datarooms/${dataroomId}/conversations/${conversationId}`;

    // For team members, provide a generic unsubscribe URL to team settings

    // Get all team member emails
    const teamMemberEmails = eligibleTeamMembers
      .map((tm) => tm.user.email)
      .filter((email): email is string => !!email);

    // Send email to all team members at once
    await sendConversationTeamNotification({
      conversationTitle: conversation.title || "Untitled Conversation",
      dataroomName: conversation.dataroom?.name || "Untitled Dataroom",
      senderEmail,
      teamMemberEmails,
      url: conversationUrl,
    });

    res.status(200).json({
      message: "Successfully sent conversation notification to team members",
      notified: teamMemberEmails.length,
      teamMemberEmails,
    });
    return;
  } catch (error) {
    log({
      message: `Failed to send conversation notification for dataroom ${dataroomId} to team members. \n\n Error: ${error} \n\n*Metadata*: \`{dataroomId: ${dataroomId}, teamId: ${teamId}}\``,
      type: "error",
      mention: true,
    });
    return res.status(500).json({ message: (error as Error).message });
  }
}
