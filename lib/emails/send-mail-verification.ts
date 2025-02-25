import ConfirmEmailChange from "@/components/emails/verification-email-change";

import { sendEmail } from "@/lib/resend";

export const sendEmailChangeVerificationRequestEmail = async (params: {
  email: string;
  url: string;
  newEmail: string;
}) => {
  const { url, email, newEmail } = params;

  const emailTemplate = ConfirmEmailChange({
    confirmUrl: url,
    email,
    newEmail,
  });

  try {
    await sendEmail({
      to: email,
      system: true,
      subject: "Confirm your email address change for Papermark!",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};
