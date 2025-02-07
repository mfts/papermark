import ConfirmEmailChange from "@/components/emails/verification-mailChange";

import { sendEmail } from "@/lib/resend";

import { generateChecksum } from "../utils/generate-checksum";

export const sendEmailChangeVerificationRequestEmail = async (params: {
  email: string;
  url: string;
  newEmail: string;
}) => {
  const { url, email, newEmail } = params;
  const checksum = generateChecksum(url);

  const verificationUrlParams = new URLSearchParams({
    verification_url: url,
    email,
    newEmail,
    checksum,
  }).toString();
  const confirmUrl = `${process.env.NEXTAUTH_URL}/auth/confirm-email-change?${verificationUrlParams}`;
  const emailTemplate = ConfirmEmailChange({
    confirmUrl,
    email,
    newEmail,
  });

  try {
    await sendEmail({
      to: email as string,
      subject: "Confirm your email address change for Papermark!",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};
