import { sendEmail } from "@/lib/resend";
import TrialEndReminderEmail from "@/components/emails/trial-end-reminder";

export const sendTrialEndReminderEmail = async (
  email: string,
  name: string | null,
) => {
  const emailTemplate = TrialEndReminderEmail({ name });
  await sendEmail({
    to: email,
    subject: `Your pro trial is ending soon`,
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
    system: true,
  });
};
