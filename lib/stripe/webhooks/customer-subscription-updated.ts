import { NextApiResponse } from "next";

import {
  BUSINESS_PLAN_LIMITS,
  DATAROOMS_PLAN_LIMITS,
  PRO_PLAN_LIMITS,
} from "@/ee/limits/constants";
import Stripe from "stripe";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

import { getPlanFromPriceId } from "../utils";

export async function customerSubsciptionUpdated(
  event: Stripe.Event,
  res: NextApiResponse,
) {
  const subscriptionUpdated = event.data.object as Stripe.Subscription;
  const priceId = subscriptionUpdated.items.data[0].price.id;

  const plan = getPlanFromPriceId(priceId);

  if (!plan) {
    await log({
      message: `Invalid price ID in customer.subscription.updated event: ${priceId}`,
      type: "error",
    });
    return;
  }

  const stripeId = subscriptionUpdated.customer.toString();

  const team = await prisma.team.findUnique({
    where: { stripeId },
  });

  if (!team) {
    await log({
      message:
        "Team with Stripe ID *`" +
        stripeId +
        "`* not found in Stripe webhook `customer.subscription.updated` callback",
      type: "error",
    });
    return res.status(200).json({ received: true });
  }

  const newPlan = plan.slug;
  const subscriptionId = subscriptionUpdated.id;
  const startsAt = new Date(subscriptionUpdated.current_period_start * 1000);
  const endsAt = new Date(subscriptionUpdated.current_period_end * 1000);

  // If a team upgrades/downgrades their subscription, update their plan
  if (team.plan !== newPlan) {
    // Choose the correct plan limits
    let planLimits = structuredClone(PRO_PLAN_LIMITS);
    if (plan.slug === "pro") {
      planLimits = structuredClone(PRO_PLAN_LIMITS);
    } else if (plan.slug === "business") {
      planLimits = structuredClone(BUSINESS_PLAN_LIMITS);
    } else if (plan.slug === "datarooms") {
      planLimits = structuredClone(DATAROOMS_PLAN_LIMITS);
    }

    // Update the user with the subscription information and stripeId
    await prisma.team.update({
      where: { stripeId },
      data: {
        plan: plan.slug,
        subscriptionId,
        startsAt,
        endsAt,
        limits: planLimits,
      },
    });
  }
}
