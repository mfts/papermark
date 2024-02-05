import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "node:stream";
import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getPlanFromPriceId, isNewCustomer } from "@/lib/stripe/utils";
import { log } from "@/lib/utils";
import { sendUpgradePlanEmail } from "@/lib/emails/send-upgrade-plan";
import { identifyUser, trackAnalytics } from "@/lib/analytics";

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
            await log("Missing items in Stripe webhook callback");
            return;
          }

          const clientReferenceId = checkoutSession.client_reference_id;
          const stripeId = checkoutSession.customer.toString();

          // Check if there are pending subscription updates for this user
          if (pendingSubscriptionUpdates.has(stripeId)) {
            const pendingUpdate = pendingSubscriptionUpdates.get(stripeId);
            const { plan, subscriptionId, startsAt, endsAt, newCustomer } =
              pendingUpdate as SubscriptionInfo;

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
              });
            }

            await identifyUser(team.users[0].user.id);
            await trackAnalytics({
              event: "User Upgraded",
              email: team.users[0].user.email,
            });

            // Remove the pending update from the store
            pendingSubscriptionUpdates.delete(stripeId);
          }

          // for subscription updates
        } else if (event.type === "customer.subscription.updated") {
          const subscriptionUpdated = event.data.object as Stripe.Subscription;
          const priceId = subscriptionUpdated.items.data[0].price.id;
          const newCustomer = isNewCustomer(event.data.previous_attributes);

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

          // If project cancels their subscription
        } else if (event.type === "customer.subscription.deleted") {
          const subscriptionDeleted = event.data.object as Stripe.Subscription;

          const stripeId = subscriptionDeleted.customer.toString();

          // If a project deletes their subscription, reset their usage limit in the database to 1000.
          // Also remove the root domain redirect for all their domains from Redis.
          const team = await prisma.team.update({
            where: {
              stripeId,
            },
            data: {
              plan: "free",
              subscriptionId: null,
              endsAt: null,
              startsAt: null,
            },
            select: { id: true },
          });

          if (!team) {
            await log(
              "Team with stripeId: `" +
                stripeId +
                "`not found in Stripe webhook `customer.subscription.deleted` callback",
            );
            return;
          }

          await log(
            ":cry: Team *`" + team.id + "`* deleted their subscription",
          );
        } else {
          throw new Error("Unhandled relevant event!");
        }
      } catch (error) {
        await log(
          `Stripe webook failed for Event: *${event.type}* (_${
            event.id
          }_) \n\n Error: ${(error as Error).message}`,
        );
        return;
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
