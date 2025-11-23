import { sendEmail } from "@/lib/resend";

import SubscriptionRenewalReminderEmail from "@/components/emails/subscription-renewal-reminder";

export const sendSubscriptionRenewalReminderEmail = async (params: {
  customerName: string | null;
  customerEmail: string;
  renewalDate: string;
  amount: string;
  currency: string;
}) => {
  const { customerName, customerEmail, renewalDate, amount, currency } =
    params;

  const emailTemplate = SubscriptionRenewalReminderEmail({
    customerName,
    renewalDate,
    amount,
    currency,
  });

  try {
    await sendEmail({
      to: customerEmail,
      subject: "Your Papermark subscription renews soon",
      react: emailTemplate,
      system: true,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error("Error sending subscription renewal reminder email:", e);
    throw e;
  }
};
