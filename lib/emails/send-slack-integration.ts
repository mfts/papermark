import SlackIntegrationEmail from "@/components/emails/slack-integration";

import { sendEmail } from "@/lib/resend";

import { CreateUserEmailProps } from "../types";

export const sendSlackIntegrationEmail = async (params: CreateUserEmailProps) => {
  const { name, email } = params.user;
  
  // Schedule the email to be sent 1 day from now (24 hours)
  const oneDayFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
  
  const emailTemplate = SlackIntegrationEmail({ name });
  try {
    await sendEmail({
      to: email as string,
      subject: "See who viewed your documents in Slack ",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      scheduledAt: oneDayFromNow,
    });
  } catch (e) {
    console.error(e);
  }
};