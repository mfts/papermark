import Onboarding5Email from "@/components/emails/onboarding-5";

import { sendEmail } from "@/lib/resend";

import { CreateUserEmailProps } from "../types";

export const sendDataroomInfoEmail = async (params: CreateUserEmailProps) => {
  const { email } = params.user;

  let emailTemplate;
  let subject;

  emailTemplate = Onboarding5Email();
  subject = "Virtual Data Rooms";

  try {
    await sendEmail({
      to: email as string,
      subject,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};
