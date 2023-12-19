import { sendEmail } from "@/lib/resend";
import ViewedDataroomEmail from "@/components/emails/viewed-dataroom";

export const sendViewedDataroomEmail = async (
  email: string,
  dataroomId: string,
  dataroomName : string,
  viewerEmail: string | null,
) => {
  const emailTemplate = ViewedDataroomEmail({ dataroomId, dataroomName, viewerEmail });
  await sendEmail({
    to: email,
    subject: `Your dataroom has been viewed: ${dataroomName}`,
    react: emailTemplate,
    test: process.env.NODE_ENV === "development",
  });
};
