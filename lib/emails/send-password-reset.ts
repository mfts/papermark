import { sendEmail } from "@/lib/resend";

import PasswordResetEmail from "@/components/emails/password-reset";

export const sendPasswordResetEmail = async ({
  email,
  resetUrl,
  name,
}: {
  email: string;
  resetUrl: string;
  name: string;
}) => {
  const emailTemplate = PasswordResetEmail({
    resetUrl,
    name,
  });

  try {
    await sendEmail({
      to: email,
      subject: "Reset your Papermark password",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};