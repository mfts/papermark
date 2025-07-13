import { NextApiResponse } from "next";

import { hashToken } from "@/lib/api/auth/token";
import { sendTeammateInviteEmail } from "@/lib/emails/send-teammate-invite";
import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { generateJWT } from "@/lib/utils/generate-jwt";

export default createTeamHandler(
  {
    PUT: async (req: AuthenticatedRequest, res: NextApiResponse) => {
      const { teamId } = req.query as { teamId: string };
      const { email } = req.body as { email: string };

      try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 168); // invitation expires in 7 days

        // update invitation
        const invitation = await prisma.invitation.update({
          where: {
            email_teamId: {
              email: email,
              teamId: teamId,
            },
          },
          data: {
            expires: expiresAt,
          },
          select: {
            token: true,
          },
        });

        const verificationTokenRecord =
          await prisma.verificationToken.findUnique({
            where: { token: hashToken(invitation.token) },
          });

        if (!verificationTokenRecord) {
          await prisma.verificationToken.create({
            data: {
              expires: expiresAt,
              token: hashToken(invitation.token),
              identifier: email,
            },
          });
        } else {
          await prisma.verificationToken.update({
            where: { token: hashToken(invitation.token) },
            data: {
              expires: expiresAt,
            },
          });
        }

        // send invite email
        const sender = req.user;

        // invitation acceptance URL
        const invitationUrl = `/api/teams/${teamId}/invitations/accept?token=${invitation.token}&email=${email}`;
        const fullInvitationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${invitationUrl}`;

        // magic link
        const magicLinkParams = new URLSearchParams({
          email,
          token: invitation.token,
          callbackUrl: fullInvitationUrl,
        });

        const magicLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/email?${magicLinkParams.toString()}`;

        const verifyParams = new URLSearchParams({
          verification_url: magicLink,
          email,
          token: invitation.token,
          teamId,
          type: "invitation",
          expiresAt: expiresAt.toISOString(),
        });

        const verifyParamsObject = Object.fromEntries(verifyParams.entries());

        const jwtToken = generateJWT(verifyParamsObject);

        const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/invitation?token=${jwtToken}`;

        sendTeammateInviteEmail({
          senderName: sender.name || "",
          senderEmail: sender.email || "",
          teamName: req.team.name,
          to: email,
          url: verifyUrl,
        });

        res.status(200).json("Invitation sent again!");
      } catch (error) {
        errorhandler(error, res);
      }
    },
  },
  {
    requireAdmin: true, // Only admins can resend invitations
  },
);
