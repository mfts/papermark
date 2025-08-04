import TrialEndReminderEmail from "@/components/emails/dataroom-trial-24h";

import { sendEmail } from "@/lib/resend";

export const sendDataroomTrial24hReminderEmail = async (params: {
  email: string;
  name: string;
}) => {
  const { email, name } = params;
  
  // Schedule the email to be sent 24 hours before trial ends
  // Note: This should be called by a cron job 24 hours before trial expiration
  
  const emailTemplate = TrialEndReminderEmail({ name });
  try {
    await sendEmail({
      to: email,
      subject: `Your Data Room plan trial expires in 24 hours`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};
