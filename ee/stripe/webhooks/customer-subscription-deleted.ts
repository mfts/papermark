import { NextApiResponse } from "next";

import { FREE_PLAN_LIMITS } from "@/ee/limits/constants";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export async function customerSubscriptionDeleted(
  event: Stripe.Event,
  res: NextApiResponse,
) {
  const subscriptionDeleted = event.data.object as Stripe.Subscription;

  const stripeId = subscriptionDeleted.customer.toString();
  const subscriptionId = subscriptionDeleted.id;

  // get free plan limits
  const freePlanLimits = structuredClone(FREE_PLAN_LIMITS);

  try {
    // If a team cancels their subscription, reset their limits to free
    const team = await prisma.team.update({
      where: {
        stripeId,
        subscriptionId,
      },
      data: {
        plan: "free",
        subscriptionId: null,
        endsAt: null,
        startsAt: null,
        limits: freePlanLimits,
      },
      select: { id: true },
    });

    await log({
      message: ":cry: Team *`" + team.id + "`* deleted their subscription",
      type: "info",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      await log({
        message: `Team with Stripe ID ${stripeId} and Subscription ID ${subscriptionId} not found`,
        type: "error",
      });
      return res
        .status(200)
        .send("Team not found in database. Customer deleted their account.");
    }
    await log({
      message: `Error updating team ${stripeId} subscription ${subscriptionId}: ${error}`,
      type: "error",
    });
    return res
      .status(200)
      .send("Error processing subscription deletion webhook.");
  }
}
