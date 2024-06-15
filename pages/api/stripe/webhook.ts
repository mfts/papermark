import { NextApiRequest, NextApiResponse } from "next";

import {
  BUSINESS_PLAN_LIMITS,
  DATAROOMS_PLAN_LIMITS,
  FREE_PLAN_LIMITS,
  PRO_PLAN_LIMITS,
} from "@/ee/limits/constants";
import { Readable } from "node:stream";
import type Stripe from "stripe";

import { sendUpgradePlanEmail } from "@/lib/emails/send-upgrade-plan";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  getPlanFromPriceId,
  isNewCustomer,
  isUpgradedCustomer,
} from "@/lib/stripe/utils";
import { log } from "@/lib/utils";

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: Readable) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

interface SubscriptionInfo {
  plan: {
    name: string;
    slug: string;
    price: { monthly: any; yearly: any };
  };
  subscriptionId: string;
  startsAt: Date;
  endsAt: Date;
  newCustomer: boolean;
}

const pendingSubscriptionUpdates = new Map<string, SubscriptionInfo>();

export default async function webhookHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // POST /api/stripe/webhook – listen to Stripe webhooks
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;
    try {
      if (!sig || !webhookSecret) return;
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (relevantEvents.has(event.type)) {
      try {
        if (event.type === "checkout.session.completed") {
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

          const clientReferenceId = checkoutSession.client_reference_id;
          const stripeId = checkoutSession.customer.toString();

          // Check if there are pending subscription updates for this user
          if (pendingSubscriptionUpdates.has(stripeId)) {
            const pendingUpdate = pendingSubscriptionUpdates.get(stripeId);
            const { plan, subscriptionId, startsAt, endsAt, newCustomer } =
              pendingUpdate as SubscriptionInfo;

            let planLimits = structuredClone(PRO_PLAN_LIMITS);
            if (plan.slug === "pro") {
              planLimits = structuredClone(PRO_PLAN_LIMITS);
            } else if (plan.slug === "business") {
              planLimits = structuredClone(BUSINESS_PLAN_LIMITS);
            } else if (plan.slug === "datarooms") {
              planLimits = structuredClone(DATAROOMS_PLAN_LIMITS);
            }

            // Update the user with the subscription information and stripeId
            const team = await prisma.team.update({
              where: {
                id: clientReferenceId,
              },
              data: {
                stripeId,
                plan: plan.slug,
                subscriptionId,
                startsAt,
                endsAt,
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

            // Send thank you email to project owner if they are a new customer
            if (newCustomer) {
              await sendUpgradePlanEmail({
                user: {
                  email: team.users[0].user.email as string,
                  name: team.users[0].user.name as string,
                },
                planType:
                  plan.slug.charAt(0).toUpperCase() + plan.slug.slice(1),
              });
            }

            // Remove the pending update from the store
            pendingSubscriptionUpdates.delete(stripeId);
          }

          // for subscription updates
        } else if (event.type === "customer.subscription.updated") {
          const subscriptionUpdated = event.data.object as Stripe.Subscription;
          const priceId = subscriptionUpdated.items.data[0].price.id;
          const newCustomer = isNewCustomer(event.data.previous_attributes);
          const upgradedCustomer = isUpgradedCustomer(
            event.data.previous_attributes,
          );

          const plan = getPlanFromPriceId(priceId);
          const stripeId = subscriptionUpdated.customer.toString();
          const subscriptionId = subscriptionUpdated.id;
          const startsAt = new Date(
            subscriptionUpdated.current_period_start * 1000,
          );
          const endsAt = new Date(
            subscriptionUpdated.current_period_end * 1000,
          );

          pendingSubscriptionUpdates.set(stripeId, {
            plan,
            subscriptionId,
            startsAt,
            endsAt,
            newCustomer,
          });

          let planLimits = structuredClone(PRO_PLAN_LIMITS);
          if (plan) {
            if (plan.slug === "pro") {
              planLimits = structuredClone(PRO_PLAN_LIMITS);
            } else if (plan.slug === "business") {
              planLimits = structuredClone(BUSINESS_PLAN_LIMITS);
            } else if (plan.slug === "datarooms") {
              planLimits = structuredClone(DATAROOMS_PLAN_LIMITS);
            }
          }

          // if user upgrades from Pro to Business, checkout event won't be fired
          // so we need to update the user immediately
          if (upgradedCustomer && !newCustomer) {
            await prisma.team.update({
              where: {
                stripeId: stripeId,
              },
              data: {
                plan: plan.slug,
                subscriptionId,
                startsAt,
                endsAt,
                limits: planLimits,
              },
              select: {
                id: true,
              },
            });

            pendingSubscriptionUpdates.delete(stripeId);
          }

          // If project cancels their subscription
        } else if (event.type === "customer.subscription.deleted") {
          const subscriptionDeleted = event.data.object as Stripe.Subscription;

          const stripeId = subscriptionDeleted.customer.toString();
          const subscriptionId = subscriptionDeleted.id;

          // reset the plan limits to free
          const planlimits = structuredClone(FREE_PLAN_LIMITS);

          try {
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
                limits: planlimits,
              },
              select: { id: true },
            });

            if (!team) {
              throw new Error("Team not found in database");
            }

            await log({
              message:
                ":cry: Team *`" + team.id + "`* deleted their subscription",
              type: "info",
            });
          } catch (error) {
            await log({
              message:
                "Team with stripeId: `" +
                stripeId +
                "` and subscriptionId `" +
                subscriptionId +
                "` not found in Stripe webhook `customer.subscription.deleted` callback" +
                `\n\n Error: ${(error as Error).message}` +
                `\n\n Event: https://dashboard.stripe.com/events/${event.id}`,
              type: "error",
            });
            return res
              .status(200)
              .send(
                `Acknowledged error in webhook: ${(error as Error).message}`,
              );
          }
        } else {
          throw new Error("Unhandled relevant event!");
        }
      } catch (error) {
        await log({
          message: `Stripe webook failed for Event: *${event.type}* ([_${
            event.id
          }_](https://dashboard.stripe.com/events/${event.id})) \n\n Error: ${(error as Error).message}`,
          type: "error",
          mention: true,
        });
        return res
          .status(400)
          .send(`Error in webhook: ${(error as Error).message}`);
      }
    } else {
      return res.status(400).send(`🤷‍♀️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
