import { logger, task } from "@trigger.dev/sdk/v3";

import { sendSubscriptionRenewalReminderEmail } from "@/lib/emails/send-subscription-renewal-reminder";

export const sendRenewalReminderEmailTask = task({
  id: "send-renewal-reminder-email",
  retry: { maxAttempts: 3 },
  run: async (payload: {
    customerEmail: string;
    customerName: string | null;
    renewalDate: string;
    amount: string;
    currency: string;
  }) => {
    try {
      logger.info("Sending renewal reminder email", {
        to: payload.customerEmail,
        renewalDate: payload.renewalDate,
      });

      await sendSubscriptionRenewalReminderEmail({
        customerEmail: payload.customerEmail,
        customerName: payload.customerName,
        renewalDate: payload.renewalDate,
        amount: payload.amount,
        currency: payload.currency,
      });

      logger.info("Renewal reminder email sent successfully", {
        to: payload.customerEmail,
      });
    } catch (error) {
      logger.error("Error sending renewal reminder email", {
        error,
        customerEmail: payload.customerEmail,
      });
      throw error;
    }
  },
});
