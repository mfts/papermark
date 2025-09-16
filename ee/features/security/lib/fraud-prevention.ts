import { NextApiResponse } from "next";

import { stripeInstance } from "@/ee/stripe";
import { get } from "@vercel/edge-config";
import { Stripe } from "stripe";

import { log } from "@/lib/utils";

/**
 * High-risk decline codes that indicate potential fraud
 */
const FRAUD_DECLINE_CODES = [
  "fraudulent",
  "stolen_card",
  "pickup_card",
  "restricted_card",
  "security_violation",
];

/**
 * Add email to Stripe Radar value list for blocking
 */
export async function addEmailToStripeRadar(email: string): Promise<boolean> {
  try {
    const stripeClient = stripeInstance();
    await stripeClient.radar.valueListItems.create({
      value_list: process.env.STRIPE_LIST_ID!,
      value: email,
    });

    log({
      message: `Added email ${email} to Stripe Radar blocklist`,
      type: "info",
    });
    return true;
  } catch (error) {
    log({
      message: `Failed to add email ${email} to Stripe Radar: ${error}`,
      type: "error",
    });
    return false;
  }
}

/**
 * Add email to Vercel Edge Config blocklist
 */
export async function addEmailToEdgeConfig(email: string): Promise<boolean> {
  try {
    // 1. Read current emails from Edge Config
    const currentEmails = (await get("emails")) || [];

    // Check if email already exists
    if (Array.isArray(currentEmails) && currentEmails.includes(email)) {
      log({
        message: `Email ${email} already in Edge Config blocklist`,
        type: "info",
      });
      return true;
    }

    // 2. Add new email
    const updatedEmails = Array.isArray(currentEmails)
      ? [...currentEmails, email]
      : [email];

    // 3. Update via Vercel REST API
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.AUTH_BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              operation: "update",
              key: "emails",
              value: updatedEmails,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status}`);
    }

    log({
      message: `Added email ${email} to Edge Config blocklist`,
      type: "info",
    });
    return true;
  } catch (error) {
    log({
      message: `Failed to add email to Edge Config: ${error}`,
      type: "error",
    });
    return false;
  }
}

/**
 * Process Stripe payment failure for fraud indicators
 */
export async function processPaymentFailure(
  event: Stripe.Event,
): Promise<void> {
  const paymentFailure = event.data.object as Stripe.PaymentIntent;
  const email = paymentFailure.receipt_email;
  const declineCode = paymentFailure.last_payment_error?.decline_code;

  if (!email || !declineCode) {
    return;
  }

  // Check if decline code indicates fraud
  if (FRAUD_DECLINE_CODES.includes(declineCode)) {
    log({
      message: `Fraud indicator detected: ${declineCode} for email: ${email}`,
      type: "info",
    });

    // Add to both Stripe Radar and Edge Config in parallel
    const [stripeResult, edgeConfigResult] = await Promise.allSettled([
      addEmailToStripeRadar(email),
      addEmailToEdgeConfig(email),
    ]);

    // Log results
    if (stripeResult.status === "fulfilled" && stripeResult.value) {
      log({
        message: `Successfully added ${email} to Stripe Radar`,
        type: "info",
      });
    } else {
      log({
        message: `Failed to add ${email} to Stripe Radar:`,
        type: "error",
      });
    }

    if (edgeConfigResult.status === "fulfilled" && edgeConfigResult.value) {
      log({
        message: `Successfully added ${email} to Edge Config`,
        type: "info",
      });
    } else {
      log({
        message: `Failed to add ${email} to Edge Config:`,
        type: "error",
      });
    }
  }
}
