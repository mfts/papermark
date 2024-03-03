import { sendEmail } from "@/lib/resend";
import LoginLink from "@/components/emails/verification-link";

export const sendVerificationRequestEmail = async (params: {
  email: string;
  url: string;
}) => {
  const { url, email } = params;
  const emailTemplate = LoginLink({ url });
  try {
    await sendEmail({
      to: email as string,
      subject: "Welcome to Papermark!",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};
