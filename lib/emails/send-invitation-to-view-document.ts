import { sendEmail } from "@/lib/resend";
import InvitationToViewDocument from "@/components/emails/invitation-to-view-document";

export const sendInvitationToViewDocument = async (email: string, invitationURL: string) => {
 const emailTemplate = InvitationToViewDocument({ invitationURL });
 await sendEmail({
    to: email,
    subject: `Please verify your email for to view document [Papermark.io]`,
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
  });
};
