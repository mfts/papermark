import { sendEmail } from "@/lib/resend";
import EmailVerification from "@/components/emails/email-verification";

export const sendVerificationEmail = async (email: string, verificationURL: string) => {
 const emailTemplate = EmailVerification({ verificationURL });
 await sendEmail({
    to: email,
    subject: `Please verify your email for to view document [Papermark.io]`,
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
  });
};
