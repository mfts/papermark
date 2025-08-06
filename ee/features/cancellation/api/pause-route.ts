import { NextApiRequest, NextApiResponse } from "next";

import { scheduledPauseResumeNotificationTask } from "@/ee/features/billing/lib/trigger/pause-resume-notification";
import { stripeInstance } from "@/ee/stripe";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { schedules } from "@trigger.dev/sdk/v3";
import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export async function handleRoute(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/billing/pause – pause a user's subscription
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;
    const { teamId } = req.query as { teamId: string };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: userId,
            },
          },
        },
        select: {
          id: true,
          stripeId: true,
          subscriptionId: true,
          endsAt: true,
          plan: true,
          limits: true,
        },
      });

      if (!team) {
        return res.status(400).json({ error: "Team does not exist" });
      }

      if (!team.stripeId) {
        return res.status(400).json({ error: "No Stripe customer ID" });
      }

      if (!team.subscriptionId) {
        return res.status(400).json({ error: "No subscription ID" });
      }

      const isOldAccount = team.plan.includes("+old");
      const stripe = stripeInstance(isOldAccount);

      const pauseStartsAt = team.endsAt ? new Date(team.endsAt) : new Date();
      const pauseEndsAt = new Date(pauseStartsAt);
      pauseEndsAt.setDate(pauseStartsAt.getDate() + 90);

      // Pause the subscription in Stripe
      await stripe.subscriptions.update(team.subscriptionId, {
        pause_collection: {
          behavior: "void",
          resumes_at: pauseEndsAt.getTime() / 1000, // Convert to seconds
        },
        metadata: {
          pause_starts_at: pauseStartsAt.toISOString(),
          pause_ends_at: pauseEndsAt.toISOString(),
          paused_reason: "user_request",
          original_plan: team.plan,
        },
      });

      await prisma.team.update({
        where: { id: teamId },
        data: {
          pausedAt: new Date(),
          pauseStartsAt,
          pauseEndsAt,
        },
      });

      // Schedule notification reminder 3 days before pause ends (87 days from now)
      const notificationDate = new Date(pauseStartsAt);
      notificationDate.setDate(notificationDate.getDate() + 87); // 90 - 3 = 87 days

      waitUntil(
        (async () => {
          try {
            // Create one-time schedule for pause resume notification
            const schedule = await schedules.create({
              task: scheduledPauseResumeNotificationTask.id,
              cron: `${notificationDate.getMinutes()} ${notificationDate.getHours()} ${notificationDate.getDate()} ${notificationDate.getMonth() + 1} *`,
              deduplicationKey: `pause-resume-${teamId}-${pauseEndsAt.getTime()}`,
              externalId: `${teamId}:${pauseEndsAt.toISOString()}:${team.plan}`,
            });

            await log({
              message: `Team ${teamId} (${team.plan}) paused their subscription for 3 months. Reminder scheduled for ${notificationDate.toISOString()}`,
              type: "info",
            });
          } catch (error) {
            await log({
              message: `Team ${teamId} paused successfully but failed to schedule reminder: ${error}`,
              type: "error",
            });
          }
        })(),
      );

      res.status(200).json({
        success: true,
        message: "Subscription paused successfully",
      });
    } catch (error) {
      console.error("Error pausing subscription:", error);
      await log({
        message: `Error pausing subscription for team ${teamId}: ${error}`,
        type: "error",
      });
      res.status(500).json({ error: "Failed to pause subscription" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
