import { NextApiRequest, NextApiResponse } from "next";

import { stripeInstance } from "@/ee/stripe";
import { isOldAccount } from "@/ee/stripe/utils";
import { waitUntil } from "@vercel/functions";
import { timingSafeEqual } from "crypto";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

export async function handleRoute(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  // Extract the API Key from the Authorization header with strict Bearer parsing
  const authHeader = req.headers.authorization;

  // Verify Authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // Extract token after "Bearer " prefix
  const token = authHeader.substring(7); // "Bearer ".length === 7
  const envKey = process.env.INTERNAL_API_KEY;

  // Verify both token and environment key are present and have equal length
  if (!token || !envKey || token.length !== envKey.length) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // Perform timing-safe comparison using Buffers
  try {
    const tokenBuffer = Buffer.from(token, "utf8");
    const envKeyBuffer = Buffer.from(envKey, "utf8");

    if (!timingSafeEqual(tokenBuffer, envKeyBuffer)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
  } catch (error) {
    // Handle any Buffer creation errors
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { teamId } = req.body;

  if (!teamId) {
    return res.status(400).json({ error: "teamId is required" });
  }

  try {
    // Get team details and verify it's still paused
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionId: true,
        pauseStartsAt: true,
        pauseEndsAt: true,
        pausedAt: true,
      },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Check if team is still paused
    if (!team.pausedAt || !team.pauseStartsAt || !team.pauseEndsAt) {
      return res.status(400).json({
        error: "Team is no longer paused",
        teamId,
        pausedAt: team.pausedAt,
        pauseStartsAt: team.pauseStartsAt,
        pauseEndsAt: team.pauseEndsAt,
      });
    }

    // Check if we're past the pause end date
    const now = new Date();
    if (now < team.pauseEndsAt) {
      return res.status(400).json({
        error: "Pause period has not ended yet",
        teamId,
        pauseEndsAt: team.pauseEndsAt,
        currentTime: now,
      });
    }

    if (!team.subscriptionId) {
      return res.status(400).json({
        error: "No subscription ID found",
        teamId,
      });
    }

    // Perform the automatic unpause
    const isOld = isOldAccount(team.plan);
    const stripe = stripeInstance(isOld);

    // First, check the subscription to determine if it was paused with old method or new method
    const subscription = await stripe.subscriptions.retrieve(
      team.subscriptionId,
    );

    // Check if this subscription was paused using the old pause_collection method
    const isOldPauseMethod = subscription.pause_collection !== null;

    if (isOldPauseMethod) {
      // Handle old pause_collection method
      // For automatic unpause (3 months passed), we always want to reset billing cycle
      await stripe.subscriptions.update(team.subscriptionId, {
        pause_collection: "", // Remove pause_collection (unpause)
      });
      await stripe.subscriptions.update(team.subscriptionId, {
        proration_behavior: "create_prorations", // Create prorations for immediate billing
        billing_cycle_anchor: "now", // Reset billing cycle to start immediately
      });
    } else {
      // Handle new coupon-based method
      // Since 3 months have passed, we definitely need to reset the billing cycle
      // Need to do this in two steps to avoid Stripe proration calculation issues

      // Step 1: Remove the discount first
      await stripe.subscriptions.deleteDiscount(team.subscriptionId);

      // Step 2: Reset billing cycle to charge immediately (now that discount is removed)
      await stripe.subscriptions.update(team.subscriptionId, {
        proration_behavior: "create_prorations", // Create prorations for immediate billing
        billing_cycle_anchor: "now", // Reset billing cycle to start immediately
      });
    }

    // Update database to clear pause status
    await prisma.team.update({
      where: { id: teamId },
      data: {
        pausedAt: null,
        pauseStartsAt: null,
        pauseEndsAt: null,
      },
    });

    waitUntil(
      log({
        message: `Team ${teamId} (${team.plan}) automatically unpaused after 3-month pause period ended using ${isOldPauseMethod ? "pause_collection method" : "coupon method"}.`,
        type: "info",
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Subscription automatically unpaused successfully",
      teamId,
      teamName: team.name,
    });
  } catch (error) {
    console.error("Error automatically unpausing subscription:", error);
    await log({
      message: `Error automatically unpausing subscription for team ${teamId}: ${error}`,
      type: "error",
    });

    return res.status(500).json({
      error: "Failed to automatically unpause subscription",
      teamId,
    });
  }
}
