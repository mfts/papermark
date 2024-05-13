import InvalidDomainEmail from "@/components/emails/invalid-domain";

import { sendEmail } from "@/lib/resend";

export const sendInvalidDomainEmail = async (
  email: string,
  domain: string,
  invalidDays: number,
) => {
  const emailTemplate = InvalidDomainEmail({ domain, invalidDays });
  try {
    await sendEmail({
      to: email,
      subject: `Your domain ${domain} needs to be configured`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      system: true,
    });
  } catch (e) {
    console.error(e);
  }
};
