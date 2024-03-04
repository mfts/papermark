import { sendEmail } from "@/lib/resend";
import ViewedDocumentEmail from "@/components/emails/viewed-document";

export const sendViewedDocumentEmail = async ({
  ownerEmail,
  documentId,
  documentName,
  viewerEmail,
}: {
  ownerEmail: string | null;
  documentId: string;
  documentName: string;
  viewerEmail: string | null;
}) => {
  const emailTemplate = ViewedDocumentEmail({
    documentId,
    documentName,
    viewerEmail,
  });
  try {
    if (!ownerEmail) {
      throw new Error("Document Owner not found");
    }

    const data = await sendEmail({
      to: ownerEmail,
      subject: `Your document has been viewed: ${documentName}`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      system: true,
    });

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};
