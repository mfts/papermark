import { NextApiResponse } from "next";

import {
  BUSINESS_PLAN_LIMITS,
  DATAROOMS_PLAN_LIMITS,
  DATAROOMS_PLUS_PLAN_LIMITS,
  PRO_PLAN_LIMITS,
} from "@/ee/limits/constants";
import Stripe from "stripe";

import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

import { getPlanFromPriceId } from "../utils";
import { calculateTotalUsersFromSubscription, getPlanFromSubscriptionItems } from "../pricing-utils";

export async function customerSubsciptionUpdated(
  event: Stripe.Event,
  res: NextApiResponse,
  isOldAccount: boolean = false,
) {
  const subscriptionUpdated = event.data.object as Stripe.Subscription;
  const subscriptionItems = subscriptionUpdated.items.data;

  const plan = getPlanFromSubscriptionItems(subscriptionItems, isOldAccount);

  if (!plan) {
    await log({
      message: `No valid plan found in customer.subscription.updated event for subscription items: ${subscriptionItems.map(item => item.price.id).join(', ')}, isOldAccount: ${isOldAccount}. Skipping webhook processing to prevent unintended plan changes.`,
      type: "error",
    });
    return res.status(200).json({ received: true });
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
  const totalUsers = calculateTotalUsersFromSubscription(subscriptionItems, plan.slug);

  let teamPlan = team.plan;
  if (isOldAccount) {
    // remove +old from plan
    teamPlan = teamPlan.replace("+old", "");
  }
  // If a team upgrades/downgrades their subscription, update their plan
  if (teamPlan !== newPlan) {
    // Choose the correct plan limits
    let planLimits:
      | typeof PRO_PLAN_LIMITS
      | typeof BUSINESS_PLAN_LIMITS
      | typeof DATAROOMS_PLAN_LIMITS
      | typeof DATAROOMS_PLUS_PLAN_LIMITS = structuredClone(PRO_PLAN_LIMITS);
    if (plan.slug === "pro") {
      planLimits = structuredClone(PRO_PLAN_LIMITS);
    } else if (plan.slug === "business") {
      planLimits = structuredClone(BUSINESS_PLAN_LIMITS);
    } else if (plan.slug === "datarooms") {
      planLimits = structuredClone(DATAROOMS_PLAN_LIMITS);
    } else if (plan.slug === "datarooms-plus") {
      planLimits = structuredClone(DATAROOMS_PLUS_PLAN_LIMITS);
    }

    // Update the user limit in planLimits based on the subscription users
    planLimits.users = Math.max(totalUsers, planLimits.users);

    // Update the user with the subscription information and stripeId
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

  // If new account, and the plan is the same, but the user count is different, update the user count
  if (
    !isOldAccount &&
    teamPlan === newPlan &&
    (team.limits as any)?.users !== totalUsers
  ) {
    // Update the user limit in planLimits based on the subscription users
    const newLimits = team.limits as any;
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

  // Update the subscription start and end dates
  await prisma.team.update({
    where: { stripeId },
    data: {
      startsAt,
      endsAt,
    },
  });
}
