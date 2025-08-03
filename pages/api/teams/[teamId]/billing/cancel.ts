import { NextApiRequest, NextApiResponse } from "next";

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
    // POST /api/teams/:teamId/billing/cancel – cancel a user's subscription
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;
    const { teamId } = req.query as { teamId: string };
    const { reason, feedback } = req.body as {
      reason: string;
      feedback?: string;
    };

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

      // Cancel the subscription in Stripe (at period end)
      const cancelledSubscription = await stripe.subscriptions.update(
        team.subscriptionId,
        {
          cancel_at_period_end: true,
          cancellation_details: {
            comment:
              feedback || `Customer cancelled via flow - reason: ${reason}`,
            feedback: reason,
          },
          metadata: {
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reason,
            user_feedback: feedback || "",
          },
        },
      );

      // Log the cancellation with feedback
      await prisma.team.update({
        where: { id: teamId },
        data: {
          cancellationReason: reason,
          cancellationFeedback: feedback,
          cancelledAt: new Date(),
        },
      });

      await log({
        message: `Team ${teamId} cancelled their subscription. Reason: ${reason}. Feedback: ${feedback || "None"}. Subscription will end at period end: ${new Date(cancelledSubscription.current_period_end * 1000).toISOString()}`,
        type: "info",
      });

      res.status(200).json({
        success: true,
        message: "Subscription cancelled successfully",
        endsAt: new Date(cancelledSubscription.current_period_end * 1000),
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      await log({
        message: `Error cancelling subscription for team ${teamId}: ${error}`,
        type: "error",
      });
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
