import {
  BUSINESS_PLAN_LIMITS,
  DATAROOMS_PLAN_LIMITS,
  DATAROOMS_PLUS_PLAN_LIMITS,
  PRO_PLAN_LIMITS,
} from "@/ee/limits/constants";
import { stripeInstance } from "@/ee/stripe";
import { waitUntil } from "@vercel/functions";
import Stripe from "stripe";

import { sendUpgradePersonalEmail } from "@/lib/emails/send-upgrade-personal-welcome";
import { sendUpgradePlanEmail } from "@/lib/emails/send-upgrade-plan";
import prisma from "@/lib/prisma";
import { sendUpgradeOneMonthCheckinEmailTask } from "@/lib/trigger/send-scheduled-email";
import { log } from "@/lib/utils";

import { getPlanFromPriceId } from "../utils";
import { calculateTotalUsersFromSubscription, getPlanFromSubscriptionItems } from "../pricing-utils";

export async function checkoutSessionCompleted(
  event: Stripe.Event,
  isOldAccount: boolean = false,
) {
  const checkoutSession = event.data.object as Stripe.Checkout.Session;

  if (
    checkoutSession.client_reference_id === null ||
    checkoutSession.customer === null
  ) {
    await log({
      message: "Missing items in Stripe webhook callback",
      type: "error",
    });
    return;
  }

  const stripe = stripeInstance(isOldAccount);
  const subscription = await stripe.subscriptions.retrieve(
    checkoutSession.subscription as string,
  );
  const subscriptionItems = subscription.items.data;
  const subscriptionId = subscription.id;
  const subscriptionStart = new Date(subscription.current_period_start * 1000);
  const subscriptionEnd = new Date(subscription.current_period_end * 1000);

  console.log("subscription", subscription);
  console.log("subscription items", subscriptionItems);

  // Get the plan from subscription items (handles both legacy and hybrid pricing)
  const plan = getPlanFromSubscriptionItems(subscriptionItems, isOldAccount);

  if (!plan) {
    await log({
      message: `No valid plan found in checkout.session.completed event for subscription items: ${subscriptionItems.map(item => item.price.id).join(', ')}, isOldAccount: ${isOldAccount}. Skipping webhook processing to prevent unintended plan changes.`,
      type: "error",
    });
    return;
  }

  const stripeId = checkoutSession.customer.toString();
  const teamId = checkoutSession.client_reference_id;

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

  // Calculate total users (handles both legacy and hybrid pricing)
  const totalUsers = calculateTotalUsersFromSubscription(subscriptionItems, plan.slug);
  
  // Update the user limit in planLimits based on the calculated total users
  planLimits.users = Math.max(totalUsers, planLimits.users);

  // Update the user with the subscription information and stripeId
  const team = await prisma.team.update({
    where: {
      id: teamId,
    },
    data: {
      stripeId,
      plan: `${plan.slug}${isOldAccount ? "+old" : ""}`,
      subscriptionId,
      startsAt: subscriptionStart,
      endsAt: subscriptionEnd,
      limits: planLimits,
    },
    select: {
      id: true,
      users: {
        where: { role: "ADMIN" },
        select: {
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  // if event creation time more than 1 hour ago, return
  if (event.created < Date.now() / 1000 - 1 * 60 * 60) {
    await log({
      message: `Checkout session completed event created more than 1 hour ago: ${event.id}`,
      type: "error",
    });
    return;
  }

  // Send thank you email to project owner if they are a new customer
  waitUntil(
    sendUpgradePlanEmail({
      user: {
        email: team.users[0].user.email as string,
        name: team.users[0].user.name as string,
      },
      planType: plan.slug,
    }),
  );

  // send personal welcome email
  waitUntil(
    sendUpgradePersonalEmail({
      user: {
        email: team.users[0].user.email as string,
        name: team.users[0].user.name as string,
      },
      planSlug: plan.slug,
    }),
  );

  waitUntil(
    sendUpgradeOneMonthCheckinEmailTask.trigger(
      {
        to: team.users[0].user.email as string,
        name: team.users[0].user.name as string,
        teamId,
      },
      {
        delay: "40d",
      },
    ),
  );
}
