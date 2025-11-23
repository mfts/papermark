import { tasks } from "@trigger.dev/sdk/v3";
import Stripe from "stripe";

import { sendRenewalReminderEmailTask } from "@/lib/trigger/send-renewal-reminder";
import { log } from "@/lib/utils";

export async function invoiceUpcoming(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  // Only process invoices for yearly renewals
  const lineItems = invoice.lines.data;
  if (!lineItems || lineItems.length === 0) {
    await log({
      message: "No line items found in invoice.upcoming event",
      type: "info",
    });
    return;
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
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format amount (convert from cents to dollars/euros)
  const amount = (invoice.amount_due / 100).toFixed(2);
  const currency = invoice.currency;

  // Calculate delay: webhook arrives ~7 days before, we want to send 3 days before
  // So we delay by 4 days
  const delayInMs = 4 * 24 * 60 * 60 * 1000; // 4 days in milliseconds
  const scheduledTime = new Date(Date.now() + delayInMs);

  try {
    // Schedule the task to run in 4 days
    const handle = await tasks.trigger(
      sendRenewalReminderEmailTask.id,
      {
        customerEmail,
        customerName,
        renewalDate: formattedRenewalDate,
        amount,
        currency,
      },
      {
        delay: delayInMs,
      },
    );

    await log({
      message: `Scheduled renewal reminder email for ${customerEmail} to be sent on ${scheduledTime.toISOString()}. Renewal date: ${formattedRenewalDate}`,
      type: "info",
    });

    return handle;
  } catch (error) {
    await log({
      message: `Failed to schedule renewal reminder email for ${customerEmail}: ${error}`,
      type: "error",
    });
    throw error;
  }
}
