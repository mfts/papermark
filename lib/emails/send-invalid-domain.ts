import { sendEmail } from "@/lib/resend";
import InvalidDomainEmail from "@/components/emails/invalid-domain";

export const sendInvalidDomainEmail = async (email: string, domain: string, invalidDays: number) => {
  const emailTemplate = InvalidDomainEmail({ domain, invalidDays });
  await sendEmail({
    to: email,
    subject: `Updated Link – Your domain ${domain} needs to be configured`,
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
  });
};
