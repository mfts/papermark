import { sendEmail } from "@/lib/resend";
import SendDocument from "@/components/emails/send-document";

export const sendDocument = async (
  email: string,
  attachments: { filename: string, content: unknown }[],
  senderEmail: string = "marc@papermark.io",
  senderName: string | null = "marc",
  message: string) => {

  //Customise sender email
  if (!senderEmail.includes("papermark")) {
    senderEmail = `${senderName} <${senderEmail}>`
  } else {
    senderEmail = `Marc from Papermark <${senderEmail}>`
  }

  const emailTemplate = SendDocument({ senderEmail, message });
  const result = await sendEmail({
    from: senderEmail,
    to: email,
    subject: `${senderName} has send you a document`,
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
    attachments: attachments
  });

  return result;
};