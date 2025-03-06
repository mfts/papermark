import TeamInvitation from "@/components/emails/team-invitation";

import { sendEmail } from "@/lib/resend";

export const sendTeammateInviteEmail = async ({
  senderName,
  senderEmail,
  teamName,
  to,
  url,
}: {
  senderName: string;
  senderEmail: string;
  teamName: string;
  to: string;
  url: string;
}) => {
  try {
    await sendEmail({
      to: to,
      subject: `You are invited to join team`,
      react: TeamInvitation({
        senderName,
        senderEmail,
        teamName,
        url,
      }),
      test: process.env.NODE_ENV === "development",
      system: true,
    });
  } catch (e) {
    console.error(e);
  }
};
