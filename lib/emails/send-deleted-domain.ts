import { sendEmail } from "@/lib/resend";
import DeletedDomainEmail from "@/components/emails/deleted-domain";

export const sendDeletedDomainEmail = async (email: string, domain: string) => {
  const emailTemplate = DeletedDomainEmail({ domain });
  await sendEmail({
    to: email,
    subject: `Your domain ${domain} has been deleted`,
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
    system: true,
  });
};
