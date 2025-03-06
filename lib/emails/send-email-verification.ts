import EmailVerification from "@/components/emails/email-verification";

import { sendEmail } from "@/lib/resend";

export const sendVerificationEmail = async (
  email: string,
  verificationURL: string,
  isDataroom: boolean = false,
) => {
  const emailTemplate = EmailVerification({
    verificationURL,
    email,
    isDataroom,
  });
  try {
    await sendEmail({
      to: email,
      subject: `Verify your email address to access the ${isDataroom ? "dataroom" : "document"}`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      verify: true,
    });
  } catch (e) {
    console.error(e);
  }
};
