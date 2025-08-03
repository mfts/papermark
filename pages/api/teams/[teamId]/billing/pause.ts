import { NextApiRequest, NextApiResponse } from "next";

import { PAUSED_PLAN_LIMITS } from "@/ee/limits/constants";
import { stripeInstance } from "@/ee/stripe";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
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

      // Check if already paused
      if (team.plan.includes("paused")) {
        return res.status(400).json({ error: "Subscription already paused" });
      }

      const isOldAccount = team.plan.includes("+old");
      const stripe = stripeInstance(isOldAccount);

      // Pause the subscription in Stripe
      await stripe.subscriptions.update(team.subscriptionId, {
        pause_collection: {
          behavior: "void",
        },
        metadata: {
          paused_at: new Date().toISOString(),
          paused_reason: "user_request",
          original_plan: team.plan,
        },
      });

      // Calculate pause end date (3 months from now)
      const pauseEndDate = new Date();
      pauseEndDate.setMonth(pauseEndDate.getMonth() + 3);

      // Update team with paused status and limits
      const pausedPlanLimits = {
        ...team.limits,
        ...PAUSED_PLAN_LIMITS,
      };

      await prisma.team.update({
        where: { id: teamId },
        data: {
          plan: `${team.plan}+paused`,
          limits: pausedPlanLimits,
          pausedAt: new Date(),
          pauseEndsAt: pauseEndDate,
        },
      });

      await log({
        message: `Team ${teamId} paused their subscription for 3 months`,
        type: "info",
      });

      res.status(200).json({
        success: true,
        message: "Subscription paused successfully",
        pauseEndsAt: pauseEndDate,
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
