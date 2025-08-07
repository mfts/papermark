import UpgradeCongratsEmail from "@/components/emails/upgrade-personal-welcome";

import { sendEmail } from "@/lib/resend";

import { CreateUserEmailProps } from "../types";

export const sendUpgradeCongratsEmail = async (params: CreateUserEmailProps & { planName?: string }) => {
  const { name, email } = params.user;
  const { planName = "Pro" } = params;
  
  // Schedule the email to be sent 6 minutes from now
  const sixMinuteFromNow = new Date(Date.now() + 1000 * 60 * 6).toISOString();
  
  // Get the first name from the full name
  const firstName = name ? name.split(" ")[0] : null;
  
  const emailTemplate = UpgradeCongratsEmail({ name: firstName, planName });
  try {
    await sendEmail({
      to: email as string,
      subject: `Your Papermark account is ready`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      scheduledAt: sixMinuteFromNow,
    });
  } catch (e) {
    console.error(e);
  }
};