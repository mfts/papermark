import { NextApiResponse } from "next";

import {
  BUSINESS_PLAN_LIMITS,
  DATAROOMS_PLAN_LIMITS,
  DATAROOMS_PLUS_PLAN_LIMITS,
  DATAROOMS_PREMIUM_PLAN_LIMITS,
  PRO_PLAN_LIMITS,
} from "@/ee/limits/constants";
import { getPlanFromSubscriptionItems } from "@/ee/stripe/functions/get-plan-from-subscription";
import Stripe from "stripe";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export async function customerSubsciptionUpdated(
  event: Stripe.Event,
  res: NextApiResponse,
  isOldAccount: boolean = false,
) {
  const subscriptionUpdated = event.data.object as Stripe.Subscription;

  const planInfo = getPlanFromSubscriptionItems(
    subscriptionUpdated.items.data,
    isOldAccount,
  );

  if (!planInfo) {
    const priceIds = subscriptionUpdated.items.data
      .map((i) => i.price.id)
      .join(", ");
    await log({
      message: `Invalid price IDs in customer.subscription.updated: ${priceIds}, isOldAccount: ${isOldAccount}. Skipping.`,
      type: "error",
    });
    return res.status(200).json({ received: true });
  }

  const { plan, totalUsers } = planInfo;
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

  let teamPlan = team.plan;
  if (isOldAccount) {
    teamPlan = teamPlan.replace("+old", "");
  }

  if (teamPlan !== newPlan) {
    let planLimits:
      | typeof PRO_PLAN_LIMITS
      | typeof BUSINESS_PLAN_LIMITS
      | typeof DATAROOMS_PLAN_LIMITS
      | typeof DATAROOMS_PLUS_PLAN_LIMITS
      | typeof DATAROOMS_PREMIUM_PLAN_LIMITS = structuredClone(PRO_PLAN_LIMITS);
    if (plan.slug === "pro") {
      planLimits = structuredClone(PRO_PLAN_LIMITS);
    } else if (plan.slug === "business") {
      planLimits = structuredClone(BUSINESS_PLAN_LIMITS);
    } else if (plan.slug === "datarooms") {
      planLimits = structuredClone(DATAROOMS_PLAN_LIMITS);
    } else if (plan.slug === "datarooms-plus") {
      planLimits = structuredClone(DATAROOMS_PLUS_PLAN_LIMITS);
    } else if (plan.slug === "datarooms-premium") {
      planLimits = structuredClone(DATAROOMS_PREMIUM_PLAN_LIMITS);
    }

    planLimits.users = Math.max(totalUsers, planLimits.users);

    await prisma.team.update({
      where: { stripeId },
      data: {
        plan: `${plan.slug}${isOldAccount ? "+old" : ""}`,
        subscriptionId,
        startsAt,
        endsAt,
        limits: planLimits,
      },
    });
  }

  // If same plan but user count changed, update the limit
  if (
    !isOldAccount &&
    teamPlan === newPlan &&
    (team.limits as any)?.users !== totalUsers
  ) {
    const newLimits = { ...(team.limits as any) };
    newLimits.users = totalUsers;
    await prisma.team.update({
      where: { stripeId },
      data: {
        plan: plan.slug,
        subscriptionId,
        startsAt,
        endsAt,
        limits: newLimits,
      },
    });
  }

  await prisma.team.update({
    where: { stripeId },
    data: {
      startsAt,
      endsAt,
    },
  });
}
