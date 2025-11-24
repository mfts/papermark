import { sendEmail } from "@/lib/resend";

import DataroomViewerInvitation from "@/ee/features/dataroom-invitations/emails/components/dataroom-viewer-invitation";

export const sendDataroomViewerInvite = async ({
  dataroomName,
  senderEmail,
  to,
  url,
  customMessage,
}: {
  dataroomName: string;
  senderEmail: string;
  to: string;
  url: string;
  customMessage?: string;
}) => {
  try {
    await sendEmail({
      to: to,
      subject: `You are invited to view ${dataroomName}`,
      react: DataroomViewerInvitation({
        senderEmail,
        dataroomName,
        url,
        recipientEmail: to,
        customMessage,
      }),
      test: process.env.NODE_ENV === "development",
      system: true,
    });
  } catch (e) {
    console.error(e);
  }
};
