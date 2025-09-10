import { sendEmail } from "@/lib/resend";

import UpgradeOneMonthCheckinEmail from "@/components/emails/upgrade-one-month-checkin";

import { CreateUserEmailProps } from "../types";

export const sendUpgradeOneMonthCheckinEmail = async (
  params: CreateUserEmailProps,
) => {
  const { name, email } = params.user;

  // Get the first name from the full name
  const firstName = name ? name.split(" ")[0] : null;

  const emailTemplate = UpgradeOneMonthCheckinEmail({
    name: firstName,
  });
  try {
    await sendEmail({
      to: email as string,
      subject: "Check-in from Papermark",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};
