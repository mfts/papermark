import SubscriptionRenewalReminderEmail from "@/ee/features/billing/renewal-reminder/emails/subscription-renewal-reminder";

import { sendEmail } from "@/lib/resend";

export const sendSubscriptionRenewalReminderEmail = async (params: {
  customerEmail: string;
  renewalDate: string;
  isOldAccount: boolean;
}) => {
  const { customerEmail, renewalDate, isOldAccount } = params;

  const emailTemplate = SubscriptionRenewalReminderEmail({
    renewalDate,
    isOldAccount,
  });

  try {
    await sendEmail({
      to: customerEmail,
      subject: "Is your payment information up to date?",
      react: emailTemplate,
      system: true,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error("Error sending subscription renewal reminder email:", e);
    throw e;
  }
};
