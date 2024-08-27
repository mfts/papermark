import DataroomTrialWelcome from "@/components/emails/dataroom-trial-welcome";

import { sendEmail } from "@/lib/resend";

export const sendDataroomTrialWelcome = async ({
  fullName,
  to,
}: {
  fullName: string;
  to: string;
}) => {
  // Schedule the email to be sent 6 minutes from now
  const sixMinuteFromNow = new Date(Date.now() + 1000 * 60 * 6).toISOString();

  // get the first name from the full name
  const name = fullName.split(" ")[0];

  try {
    await sendEmail({
      to: to,
      subject: `For ${name}`,
      react: DataroomTrialWelcome({ name }),
      test: process.env.NODE_ENV === "development",
      scheduledAt: sixMinuteFromNow,
    });
  } catch (e) {
    console.error(e);
  }
};
