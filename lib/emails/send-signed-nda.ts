import SignedNDA from "@/components/emails/signed-nda";

import { sendEmail } from "@/lib/resend";

export const sendSignedNDAEmail = async ({
  ownerEmail,
  viewId,
  documentId,
  dataroomId,
  agreementName,
  linkName,
  viewerEmail,
  viewerName,
  teamMembers,
  locationString,
}: {
  ownerEmail: string | null;
  viewId: string;
  documentId?: string;
  dataroomId?: string;
  agreementName: string;
  linkName: string;
  viewerEmail: string | null;
  viewerName?: string | null;
  teamMembers?: string[];
  locationString?: string;
}) => {
  const emailTemplate = SignedNDA({
    viewId,
    documentId,
    dataroomId,
    agreementName,
    linkName,
    viewerEmail,
    viewerName,
    locationString,
  });
  try {
    if (!ownerEmail) {
      throw new Error("Document Owner not found");
    }

    let subjectLine: string = `NDA Agreement Signed: ${agreementName}`;
    const displayName = viewerName || viewerEmail || "Someone";
    if (displayName !== "Someone") {
      subjectLine = `${displayName} signed the NDA: ${agreementName}`;
    }

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

