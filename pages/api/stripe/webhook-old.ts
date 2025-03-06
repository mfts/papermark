import { NextApiRequest, NextApiResponse } from "next";

import { stripeInstance } from "@/ee/stripe";
import { checkoutSessionCompleted } from "@/ee/stripe/webhooks/checkout-session-completed";
import { customerSubscriptionDeleted } from "@/ee/stripe/webhooks/customer-subscription-deleted";
import { customerSubsciptionUpdated } from "@/ee/stripe/webhooks/customer-subscription-updated";
import { Readable } from "node:stream";
import type Stripe from "stripe";

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

export default async function webhookHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // POST /api/stripe/webhook-old – listen to Stripe webhooks
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_OLD;
    let event: Stripe.Event;
    try {
      if (!sig || !webhookSecret) return;
      const stripe = stripeInstance(true);
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Ignore unsupported events
    if (!relevantEvents.has(event.type)) {
      return res.status(400).send(`Unhandled event type: ${event.type}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await checkoutSessionCompleted(event, true);
          break;
        case "customer.subscription.updated":
          await customerSubsciptionUpdated(event, res, true);
          break;
        case "customer.subscription.deleted":
          await customerSubscriptionDeleted(event, res);
          break;
      }
    } catch (error) {
      await log({
        message: `Stripe webhook failed. Error: ${error}`,
        type: "error",
      });
      return res
        .status(400)
        .send("Webhook error: Webhook handler failed. View logs.");
    }

    return res.status(200).json({ received: true });
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
