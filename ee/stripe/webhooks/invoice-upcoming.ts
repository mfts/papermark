import { NextApiResponse } from "next";

import { sendSubscriptionRenewalReminderEmail } from "@/ee/features/billing/renewal-reminder/lib/send-subscription-renewal-reminder";
import Stripe from "stripe";

import { log } from "@/lib/utils";

export async function invoiceUpcoming(
  event: Stripe.Event,
  res: NextApiResponse,
  isOldAccount: boolean = false,
) {
  const invoice = event.data.object as Stripe.Invoice;

  // Only process invoices for yearly renewals
  const lineItems = invoice.lines.data;
  if (!lineItems || lineItems.length === 0) {
    await log({
      message: "No line items found in invoice.upcoming event",
      type: "info",
    });
    return res.status(200).json({ received: true });
  }

  // Check if this is a yearly subscription
  const hasYearlyPlan = lineItems.some((item) => {
    if (item.price && item.price.recurring) {
      return (
        item.price.recurring.interval === "year" ||
        (item.price.recurring.interval === "month" &&
          item.price.recurring.interval_count === 12)
      );
    }
    return false;
  });

  if (!hasYearlyPlan) {
    await log({
      message: "Invoice is not for yearly renewal, skipping reminder email",
      type: "info",
    });
    return;
  }

  const customerEmail = invoice.customer_email;
  const customerName = invoice.customer_name;

  if (!customerEmail) {
    await log({
      message: "No customer email found in invoice.upcoming event",
      type: "error",
    });
    return;
  }

  // Calculate renewal date (period_end is when the invoice will be charged)
  const renewalTimestamp = invoice.period_end;
  const renewalDate = new Date(renewalTimestamp * 1000);
  const formattedRenewalDate = renewalDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  try {
    // send email immediately
    await sendSubscriptionRenewalReminderEmail({
      customerEmail,
      customerName,
      renewalDate: formattedRenewalDate,
      isOldAccount,
    });

    await log({
      message: `Renewal reminder email sent for ${customerEmail}. Renewal date: ${formattedRenewalDate}`,
      type: "info",
    });
  } catch (error) {
    await log({
      message: `Failed to send renewal reminder email for ${customerEmail}: ${error}`,
      type: "error",
    });
    return res.status(200).json({ received: true });
  }
}
