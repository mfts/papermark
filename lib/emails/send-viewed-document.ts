import { sendEmail } from "@/lib/resend";
import ViewedDocumentEmail from "@/components/emails/viewed-document";

export const sendViewedDocumentEmail = async ({
  email,
  documentId,
  documentName,
  viewerEmail,
}: {
  email: string;
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
    const data = await sendEmail({
      to: email,
      subject: `Your document has been viewed: ${documentName}`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      system: true,
    });

    // If sendEmail is successful, return the data
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};
