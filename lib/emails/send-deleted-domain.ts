import DeletedDomainEmail from "@/components/emails/deleted-domain";

import { sendEmail } from "@/lib/resend";

export const sendDeletedDomainEmail = async (email: string, domain: string) => {
  const emailTemplate = DeletedDomainEmail({ domain });
  try {
    await sendEmail({
      to: email,
      subject: `Your domain ${domain} has been deleted`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      system: true,
    });
  } catch (e) {
    console.error(e);
  }
};
