import { sendEmail } from "@/lib/resend";
import InvitationToViewDocument from "@/components/emails/invitation-to-view-document";

export const sendInvitationToViewDocument = async (
  email: string,
  invitationURL: string,
  senderEmail: string = "marc@papermark.io",
  senderName: string | null = "marc") => {

  //Customise sender email
  if (!senderEmail.includes("papermark")) {
    senderEmail = `${senderName} <${senderEmail}>`
  } else {
    senderEmail = `Marc from Papermark <${senderEmail}>`
  }

  const emailTemplate = InvitationToViewDocument({ invitationURL, senderEmail });
  const result = await sendEmail({
    from: senderEmail,
    to: email,
    subject: `${senderName} is inviting you to view document`,
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
  });

  return result;
};
