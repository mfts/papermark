import { sendEmail } from "@/lib/resend";

import DownloadReady from "@/components/emails/download-ready";

export const sendDownloadReadyEmail = async ({
  to,
  dataroomName,
  downloadUrl,
  expiresAt,
  isViewer,
}: {
  to: string;
  dataroomName: string;
  downloadUrl: string;
  expiresAt?: string;
  isViewer?: boolean;
}) => {
  const emailTemplate = DownloadReady({
    dataroomName,
    downloadUrl,
    email: to,
    expiresAt,
    isViewer: isViewer ?? false,
  });

  try {
    await sendEmail({
      to,
      subject: `Your ${dataroomName} download is ready`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      system: true,
    });
  } catch (e) {
    console.error("Error sending download ready email:", e);
    throw e;
  }
};
