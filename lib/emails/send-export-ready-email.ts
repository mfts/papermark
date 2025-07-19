import { sendEmail } from "@/lib/resend";

import ExportReady from "@/components/emails/export-ready";

export const sendExportReadyEmail = async ({
  to,
  resourceName,
  downloadUrl,
}: {
  to: string;
  resourceName: string;
  downloadUrl: string;
}) => {
  const emailTemplate = ExportReady({ resourceName, downloadUrl, email: to });

  try {
    await sendEmail({
      to,
      subject: `Your ${resourceName} export is ready`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
      system: true,
    });
  } catch (e) {
    console.error("Error sending export ready email:", e);
    throw e;
  }
};
