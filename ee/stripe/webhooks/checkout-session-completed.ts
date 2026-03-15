import {
  BUSINESS_PLAN_LIMITS,
  DATAROOMS_PLAN_LIMITS,
  DATAROOMS_PLUS_PLAN_LIMITS,
  DATAROOMS_PREMIUM_PLAN_LIMITS,
  DATAROOMS_UNLIMITED_PLAN_LIMITS,
  PRO_PLAN_LIMITS,
} from "@/ee/limits/constants";
import { stripeInstance } from "@/ee/stripe";
import { getPlanFromSubscriptionItems } from "@/ee/stripe/functions/get-plan-from-subscription";
import { waitUntil } from "@vercel/functions";
import Stripe from "stripe";

import { sendUpgradePersonalEmail } from "@/lib/emails/send-upgrade-personal-welcome";
import { sendUpgradePlanEmail } from "@/lib/emails/send-upgrade-plan";
import prisma from "@/lib/prisma";
import { sendUpgradeOneMonthCheckinEmailTask } from "@/lib/trigger/send-scheduled-email";
import { log } from "@/lib/utils";

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
  const subscriptionId = subscription.id;
  const subscriptionStart = new Date(subscription.current_period_start * 1000);
  const subscriptionEnd = new Date(subscription.current_period_end * 1000);

  console.log("subscription", subscription);
  console.log("subscription items", subscription.items.data);

  const planInfo = getPlanFromSubscriptionItems(
    subscription.items.data,
    isOldAccount,
  );

  if (!planInfo) {
    const priceIds = subscription.items.data
      .map((i) => i.price.id)
      .join(", ");
    await log({
      message: `Invalid price IDs in checkout.session.completed: ${priceIds}, isOldAccount: ${isOldAccount}. Skipping to prevent unintended plan changes.`,
      type: "error",
    });
    return;
  }

  const { plan, totalUsers } = planInfo;
  const stripeId = checkoutSession.customer.toString();
  const teamId = checkoutSession.client_reference_id;

  const PLAN_LIMITS_MAP: Record<string, any> = {
    pro: PRO_PLAN_LIMITS,
    business: BUSINESS_PLAN_LIMITS,
    datarooms: DATAROOMS_PLAN_LIMITS,
    "datarooms-plus": DATAROOMS_PLUS_PLAN_LIMITS,
    "datarooms-premium": DATAROOMS_PREMIUM_PLAN_LIMITS,
    "datarooms-unlimited": DATAROOMS_UNLIMITED_PLAN_LIMITS,
  };
  const planLimits = structuredClone(
    PLAN_LIMITS_MAP[plan.slug] ?? PRO_PLAN_LIMITS,
  );

  planLimits.users = Math.max(totalUsers, planLimits.users);

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
      cancelledAt: null,
      pausedAt: null,
      pauseStartsAt: null,
      pauseEndsAt: null,
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

  if (event.created < Date.now() / 1000 - 1 * 60 * 60) {
    await log({
      message: `Checkout session completed event created more than 1 hour ago: ${event.id}`,
      type: "error",
    });
    return;
  }

  waitUntil(
    sendUpgradePlanEmail({
      user: {
        email: team.users[0].user.email as string,
        name: team.users[0].user.name as string,
      },
      planType: plan.slug,
    }),
  );

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
