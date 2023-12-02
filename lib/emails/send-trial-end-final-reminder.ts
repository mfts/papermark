import { sendEmail } from "@/lib/resend";
import TrialEndFinalReminderEmail from "@/components/emails/trial-end-final-reminder";

export const sendTrialEndFinalReminderEmail = async (
  email: string,
  name: string | null,
) => {
  const emailTemplate = TrialEndFinalReminderEmail({ name });
  await sendEmail({
    to: email,
    subject: `Your pro trial expires in 24 hours`,
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
    system: true,
  });
};
