import { sendEmail } from "@/lib/resend";

import EmailVerificationEmail from "@/components/emails/email-verification";

export const sendEmailVerificationEmail = async (params: {
  email: string;
  token: string;
}) => {
  const { email, token } = params;

  const baseUrl = process.env.NEXTAUTH_URL || "https://app.papermark.com";
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const emailTemplate = EmailVerificationEmail({ url: verificationUrl });

  try {
    await sendEmail({
      to: email,
      system: true,
      subject: "Verify your email address - Papermark",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[Email Verification URL]", verificationUrl);
    }
  } catch (e) {
    console.error("Failed to send email verification email:", e);
    throw e;
  }
};
