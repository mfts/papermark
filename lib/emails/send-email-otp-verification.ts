import OtpEmailVerification from "@/components/emails/otp-verification";

import { sendEmail } from "@/lib/resend";

export const sendOtpVerificationEmail = async (
  email: string,
  code: string,
  isDataroom: boolean = false,
) => {
  const emailTemplate = OtpEmailVerification({
    email,
    code,
    isDataroom,
  });
  try {
    await sendEmail({
      to: email,
      subject: `One-time passcode to access the ${isDataroom ? "dataroom" : "document"}`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      verify: true,
    });
  } catch (e) {
    console.error(e);
  }
};
