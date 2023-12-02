import { sendEmail } from "@/lib/resend";
import WelcomeEmail from "@/components/emails/welcome";
import { CreateUserEmailProps } from "../types";

export const sendWelcomeEmail = async (params: CreateUserEmailProps) => {
  const { name, email } = params.user;
  const emailTemplate = WelcomeEmail({ name });
  await sendEmail({
    to: email as string,
    subject: "Welcome to Papermark.io!",
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
  });
};
