import UpgradeCheckinEmail from "@/components/emails/upgrade-checkin";

import { sendEmail } from "@/lib/resend";

import { CreateUserEmailProps } from "../types";

export const sendUpgradeCheckinEmail = async (params: CreateUserEmailProps & { planName?: string }) => {
  const { name, email } = params.user;
  const { planName = "Pro" } = params;
  
  // Schedule the email to be sent 1.5 months from now (45 days)
  const oneAndHalfMonthsFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString();
  
  // Get the first name from the full name
  const firstName = name ? name.split(" ")[0] : null;
  
  const emailTemplate = UpgradeCheckinEmail({ name: firstName, planName });
  try {
    await sendEmail({
      to: email as string,
      subject: "Check-in from Marc",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      scheduledAt: oneAndHalfMonthsFromNow,
    });
  } catch (e) {
    console.error(e);
  }
};