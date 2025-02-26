import { NextApiResponse } from "next";

import { FREE_PLAN_LIMITS } from "@/ee/limits/constants";
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

  if (!team) {
    await log({
      message:
        "Team with Stripe ID *`" +
        stripeId +
        "` and Subscription ID *`" +
        subscriptionId +
        "`* not found in Stripe webhook `customer.subscription.deleted` callback" +
        `\n\n Event: https://dashboard.stripe.com/events/${event.id}`,
      type: "error",
    });
    return res.status(200).json({ received: true });
  }

  await log({
    message: ":cry: Team *`" + team.id + "`* deleted their subscription",
    type: "info",
  });
}
