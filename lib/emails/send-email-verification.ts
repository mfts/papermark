import { sendEmail } from "@/lib/resend";
import EmailVerification from "@/components/emails/email-verification";

export const sendVerificationEmail = async (
  email: string,
  verificationURL: string,
) => {
  const emailTemplate = EmailVerification({ verificationURL, email });
  try {
    await sendEmail({
      to: email,
      subject: "Verify your email address",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      system: true,
    });
  } catch (e) {
    console.error(e);
  }
};
