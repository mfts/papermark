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
    // POST /api/teams/:teamId/billing/retention-offer – apply retention offer
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const userId = (session.user as CustomUser).id;
    const { teamId } = req.query as { teamId: string };
    const { reason, offerType } = req.body as {
      reason: string;
      offerType: string;
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

      // Determine discount based on reason
      let discountPercent = 25;
      let durationMonths = 3;

      if (reason === "technical-issues") {
        discountPercent = 50;
        durationMonths = 2;
      } else if (
        reason === "too-expensive" ||
        reason === "switching-competitor"
      ) {
        discountPercent = 25;
        durationMonths = 3;
      }

      // Create a discount coupon in Stripe
      const coupon = await stripe.coupons.create({
        percent_off: discountPercent,
        duration: "repeating",
        duration_in_months: durationMonths,
        name: `Retention Offer - ${discountPercent}% off for ${durationMonths} months`,
        metadata: {
          reason,
          team_id: teamId,
          applied_at: new Date().toISOString(),
        },
      });

      // Apply the coupon to the subscription
      await stripe.subscriptions.update(team.subscriptionId, {
        discounts: [{ coupon: coupon.id }],
        metadata: {
          retention_offer_applied: new Date().toISOString(),
          retention_reason: reason,
        },
      });

      await log({
        message: `Retention offer applied to team ${teamId}: ${discountPercent}% off for ${durationMonths} months (reason: ${reason})`,
        type: "info",
      });

      res.status(200).json({
        success: true,
        message: "Retention offer applied successfully",
        discount: discountPercent,
        duration: durationMonths,
        couponId: coupon.id,
      });
    } catch (error) {
      console.error("Error applying retention offer:", error);
      await log({
        message: `Error applying retention offer for team ${teamId}: ${error}`,
        type: "error",
      });
      res.status(500).json({ error: "Failed to apply retention offer" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
