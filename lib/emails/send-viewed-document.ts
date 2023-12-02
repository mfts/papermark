import { sendEmail } from "@/lib/resend";
import ViewedDocumentEmail from "@/components/emails/viewed-document";

export const sendViewedDocumentEmail = async (
  email: string,
  documentId: string,
  documentName: string,
  viewerEmail: string | null,
) => {
  const emailTemplate = ViewedDocumentEmail({
    documentId,
    documentName,
    viewerEmail,
  });
  await sendEmail({
    to: email,
    subject: `Your document has been viewed: ${documentName}`,
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
    system: true,
  });
};
