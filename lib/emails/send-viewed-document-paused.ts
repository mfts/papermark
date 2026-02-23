import { sendEmail } from "@/lib/resend";

import ViewedDocumentPausedEmail from "@/components/emails/viewed-document-paused";

export const sendViewedDocumentPausedEmail = async ({
  ownerEmail,
  documentName,
  linkName,
  teamMembers,
}: {
  ownerEmail: string | null;
  documentName: string;
  linkName: string;
  teamMembers?: string[];
}) => {
  const emailTemplate = ViewedDocumentPausedEmail({
    documentName,
    linkName,
  });
  try {
    if (!ownerEmail) {
      throw new Error("Document Owner not found");
    }

    const subjectLine = `Your document has been viewed: ${documentName}`;

    const data = await sendEmail({
      to: ownerEmail,
      cc: teamMembers,
      subject: subjectLine,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      system: true,
    });

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};
