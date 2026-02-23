import { sendEmail } from "@/lib/resend";

import ViewedDataroomPausedEmail from "@/components/emails/viewed-dataroom-paused";

export const sendViewedDataroomPausedEmail = async ({
  ownerEmail,
  dataroomName,
  linkName,
  teamMembers,
}: {
  ownerEmail: string | null;
  dataroomName: string;
  linkName: string;
  teamMembers?: string[];
}) => {
  const emailTemplate = ViewedDataroomPausedEmail({
    dataroomName,
    linkName,
  });
  try {
    if (!ownerEmail) {
      throw new Error("Dataroom Admin not found");
    }

    const subjectLine = `Your dataroom has been viewed: ${dataroomName}`;

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
