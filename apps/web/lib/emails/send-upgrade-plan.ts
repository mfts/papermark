import { sendEmail } from "@/lib/resend";
import UpgradePlanEmail from "@/components/emails/upgrade-plan";
import { CreateUserEmailProps } from "../types";

export const sendUpgradePlanEmail = async (params: CreateUserEmailProps) => {
  const { name, email } = params.user;
  const emailTemplate = UpgradePlanEmail({ name });
  await sendEmail({
    to: email as string,
    subject: "Thank you for upgrading to Papermark Pro!",
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
  });
};
