import DataroomUploadNotification from "@/components/emails/dataroom-upload-notification";

import { sendEmail } from "@/lib/resend";

export const sendDataroomUploadNotification = async ({
  ownerEmail,
  dataroomId,
  dataroomName,
  uploaderEmail,
  documentNames,
  linkName,
  teamMembers,
}: {
  ownerEmail: string;
  dataroomId: string;
  dataroomName: string;
  uploaderEmail: string | null;
  documentNames: string[];
  linkName: string;
  teamMembers?: string[];
}) => {
  const documentCount = documentNames.length;
  const documentLabel = documentCount === 1 ? "document" : "documents";

  let subjectLine = `${documentCount} new ${documentLabel} uploaded to ${dataroomName}`;
  if (uploaderEmail) {
    subjectLine = `${uploaderEmail} uploaded ${documentCount} ${documentLabel} to ${dataroomName}`;
  }

  const emailTemplate = DataroomUploadNotification({
    dataroomId,
    dataroomName,
    uploaderEmail,
    documentNames,
    linkName,
  });

  try {
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
