import { NextApiRequest, NextApiResponse } from "next";

import { getDisplayNameFromPlan } from "@/ee/stripe/functions/get-display-name-from-plan";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

import { sendEmailPauseResumeReminder } from "../emails/lib/send-email-pause-resume-reminder";

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

  const { teamId } = validationResult.data;

  try {
    // Get all team members (ADMIN/MANAGER) for this team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        name: true,
        plan: true,
        pauseEndsAt: true,
        users: {
          where: {
            role: {
              in: ["ADMIN", "MANAGER"],
            },
            blockedAt: null, // Only active team members (not blocked)
          },
          select: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const teamMembers = team?.users;

    if (!teamMembers || teamMembers.length === 0) {
      res.status(200).json({
        message: "No team members found for notifications",
        notified: 0,
      });
      return;
    }

    if (!team.pauseEndsAt) {
      res.status(200).json({
        message: "Team is not paused",
        notified: 0,
      });
      return;
    }

    // Get all team member emails
    const teamMemberEmails = teamMembers
      .map((tm) => tm.user.email)
      .filter((email): email is string => !!email);

    // Send email to all team members at once
    await sendEmailPauseResumeReminder({
      teamName: team.name,
      plan: getDisplayNameFromPlan(team.plan),
      resumeDate: team.pauseEndsAt.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      teamMemberEmails,
    });

    res.status(200).json({
      message: "Successfully sent pause resume reminder to team members",
      notified: teamMemberEmails.length,
    });
    return;
  } catch (error) {
    log({
      message: `Failed to send pause resume reminder for team ${teamId} to team members. \n\n Error: ${error} \n\n*Metadata*: \`{teamId: ${teamId}}\``,
      type: "error",
      mention: true,
    });
    return res
      .status(500)
      .json({ message: "Failed to send pause resume reminder" });
  }
}
