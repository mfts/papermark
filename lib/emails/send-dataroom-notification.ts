import DataroomNotification from "@/components/emails/dataroom-notification";

import { sendEmail } from "@/lib/resend";

export const sendDataroomNotification = async ({
  dataroomName,
  documentName,
  senderEmail,
  to,
  url,
}: {
  dataroomName: string;
  documentName: string | undefined;
  senderEmail: string;
  to: string;
  url: string;
}) => {
  try {
    await sendEmail({
      to: to,
      subject: `New document available in ${dataroomName}`,
      react: DataroomNotification({
        senderEmail,
        dataroomName,
        documentName,
        url,
      }),
      test: process.env.NODE_ENV === "development",
      system: true,
    });
  } catch (e) {
    console.error(e);
  }
};
