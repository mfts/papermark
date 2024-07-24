import Onboarding1Email from "@/components/emails/onboarding-1";
import Onboarding2Email from "@/components/emails/onboarding-2";
import Onboarding3Email from "@/components/emails/onboarding-3";
import Onboarding4Email from "@/components/emails/onboarding-4";
import Onboarding5Email from "@/components/emails/onboarding-5";

import { sendEmail } from "@/lib/resend";

import { CreateUserEmailProps } from "../types";

type EmailType =
  | "onboarding1"
  | "onboarding2"
  | "onboarding3"
  | "onboarding4"
  | "onboarding5";

export const sendOnboardingEmail = async (
  params: CreateUserEmailProps,
  emailType: EmailType,
) => {
  const { name, email } = params.user;

  let emailTemplate;
  let subject;

  if (emailType === "onboarding1") {
    emailTemplate = Onboarding1Email({ name });
    subject = "Day 1 with Papermark - Turn your documents into links";
  } else if (emailType === "onboarding2") {
    emailTemplate = Onboarding2Email({ name });
    subject = "Day 2 - Set link permissions";
  } else if (emailType === "onboarding3") {
    emailTemplate = Onboarding3Email({ name });
    subject = "Day 3 - Track analytics on each page";
  } else if (emailType === "onboarding4") {
    emailTemplate = Onboarding4Email({ name });
    subject = "Day 4 - Custom domain and branding";
  } else if (emailType === "onboarding5") {
    emailTemplate = Onboarding5Email({ name });
    subject = "Day 5 - Virtual Data Rooms";
  }

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
