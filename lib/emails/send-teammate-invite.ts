import TeamInvitation from "@/components/emails/team-invitation";
import { sendEmail } from "@/lib/resend";

export const sendTeammateInviteEmail = async ({
  senderName,
  senderEmail,
  teamName,
  teamId,
  token,
  to,
}: {
  senderName: string;
  senderEmail: string;
  teamName: string;
  teamId: string;
  token: string;
  to: string;
}) => {
  await sendEmail({
    to: to,
    subject: `You are invited to join a ${senderName}'s team`,
    react: TeamInvitation({
      senderName,
      senderEmail,
      teamName,
      teamId,
      token,
    }),
    test: process.env.NODE_ENV === "development",
    system: true,
  });
};
