import { sendEmail } from "@/lib/resend";

import PasswordResetEmail from "@/components/emails/password-reset";

export const sendPasswordResetEmail = async (params: {
  email: string;
  token: string;
}) => {
  const { email, token } = params;

  const baseUrl = process.env.NEXTAUTH_URL || "https://app.papermark.com";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const emailTemplate = PasswordResetEmail({ url: resetUrl });

  try {
    await sendEmail({
      to: email,
      system: true,
      subject: "Reset your password - Papermark",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[Password Reset URL]", resetUrl);
    }
  } catch (e) {
    console.error("Failed to send password reset email:", e);
    throw e;
  }
};
