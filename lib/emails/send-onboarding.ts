import { sendEmail } from "@/lib/resend";

import Onboarding5Email from "@/components/emails/data-rooms-information";
import Onboarding1Email from "@/components/emails/onboarding-1";
import Onboarding2Email from "@/components/emails/onboarding-2";
import Onboarding3Email from "@/components/emails/onboarding-3";
import Onboarding4Email from "@/components/emails/onboarding-4";

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
  const { email } = params.user;

  let emailTemplate;
  let subject;

  switch (emailType) {
    case "onboarding1":
      emailTemplate = Onboarding1Email();
      subject = "Day 1 with Papermark - Turn your documents into links";
      break;
    case "onboarding2":
      emailTemplate = Onboarding2Email();
      subject = "Day 2 - Set link permissions";
      break;
    case "onboarding3":
      emailTemplate = Onboarding3Email();
      subject = "Day 3 - Track analytics on each page";
      break;
    case "onboarding4":
      emailTemplate = Onboarding4Email();
      subject = "Day 4 - Custom domain and branding";
      break;
    case "onboarding5":
      emailTemplate = Onboarding5Email();
      subject = "Day 5 - Virtual Data Rooms";
      break;
    default:
      emailTemplate = Onboarding1Email();
      subject = "Day 1 with Papermark - Turn your documents into links";
      break;
  }

  try {
    await sendEmail({
      to: email as string,
      subject,
      replyTo: "Papermark <support@papermark.com>",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};
