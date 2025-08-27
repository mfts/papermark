import SixMonthMilestoneEmail from "@/components/emails/upgrade-six-month-checkin";

import { sendEmail } from "@/lib/resend";

import { CreateUserEmailProps } from "../types";

export const sendSixMonthMilestoneEmail = async (params: CreateUserEmailProps & { planName?: string }) => {
  const { name, email } = params.user;
  const { planName = "Pro" } = params;
  
  // Schedule the email to be sent 6.5 months from now (195 days)
  const sixAndHalfMonthsFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24 * 195).toISOString();
  
  // Get the first name from the full name
  const firstName = name ? name.split(" ")[0] : null;
  
  const emailTemplate = SixMonthMilestoneEmail({ name: firstName, planName });
  try {
    await sendEmail({
      to: email as string,
      subject: "6 months with Papermark",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      scheduledAt: sixAndHalfMonthsFromNow,
    });
  } catch (e) {
    console.error(e);
  }
};