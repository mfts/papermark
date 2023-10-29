import TeamInvitation from "@/components/emails/team-invitation";
import { sendEmail } from "@/lib/resend";

export const sendTeammateInviteEmail = async ({
  to,
  senderName,
  senderEmail,
  teamName,
  teamId,
  token,
}: {
  to: string;
  senderName: string;
  senderEmail: string;
  teamName: string;
  teamId: string;
  token: string;
}) => {
  await sendEmail({
    to: to,
    subject: "You are invited to join a Team",
    react: TeamInvitation({ senderName, senderEmail, teamName, teamId, token }),
  });
};
