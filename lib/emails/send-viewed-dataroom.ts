import ViewedDataroomEmail from "@/components/emails/viewed-dataroom";

import { sendEmail } from "@/lib/resend";

export const sendViewedDataroomEmail = async ({
  ownerEmail,
  dataroomId,
  dataroomName,
  viewerEmail,
  linkName,
  teamMembers,
  locationString,
}: {
  ownerEmail: string | null;
  dataroomId: string;
  dataroomName: string;
  viewerEmail: string | null;
  linkName: string;
  teamMembers?: string[];
  locationString?: string;
}) => {
  const emailTemplate = ViewedDataroomEmail({
    dataroomId,
    dataroomName,
    viewerEmail,
    linkName,
    locationString,
  });
  try {
    if (!ownerEmail) {
      throw new Error("Dataroom Admin not found");
    }

    let subjectLine: string = `Your dataroom has been viewed: ${dataroomName}`;
    if (viewerEmail) {
      subjectLine = `${viewerEmail} viewed the dataroom: ${dataroomName}`;
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
