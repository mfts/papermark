import DataroomViewerInvitation from "@/components/emails/dataroom-viewer-invitation";

import { sendEmail } from "@/lib/resend";

export const sendDataroomViewerInvite = async ({
  dataroomName,
  senderEmail,
  to,
  url,
}: {
  dataroomName: string;
  senderEmail: string;
  to: string;
  url: string;
}) => {
  try {
    await sendEmail({
      to: to,
      subject: `You are invited to view ${dataroomName}`,
      react: DataroomViewerInvitation({
        senderEmail,
        dataroomName,
        url,
      }),
      test: process.env.NODE_ENV === "development",
      system: true,
    });
  } catch (e) {
    console.error(e);
  }
};
