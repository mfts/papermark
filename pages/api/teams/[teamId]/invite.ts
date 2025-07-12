import { NextApiResponse } from "next";

import { getLimits } from "@/ee/limits/server";

import { hashToken } from "@/lib/api/auth/token";
import { sendTeammateInviteEmail } from "@/lib/emails/send-teammate-invite";
import { errorhandler } from "@/lib/errorHandler";
import { newId } from "@/lib/id-helper";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { generateJWT } from "@/lib/utils/generate-jwt";

export default createTeamHandler(
  {
    POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
      const { teamId } = req.query as { teamId: string };
      const { email } = req.body;

      if (!email) {
        res.status(400).json("Email is missing in request body");
        return;
      }

      try {
        const team = await prisma.team.findUnique({
          where: {
            id: teamId,
          },
          include: {
            users: {
              select: {
                userId: true,
                role: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        });

        if (!team) {
          res.status(404).json("Team not found");
          return;
        }

        // Check if the user has reached the limit of users in the team
        const limits = await getLimits({
          teamId,
          userId: req.user.id,
        });

        if (limits && team.users.length >= limits.users) {
          res
            .status(403)
            .json("You have reached the limit of users in your team");
          return;
        }

        // check if user is already in the team
        const isExistingMember = team.users?.some(
          (user) => user.user.email === email,
        );

        if (isExistingMember) {
          res.status(400).json("User is already a member of this team");
          return;
        }

        // check if invitation already exists
        const invitationExists = await prisma.invitation.findUnique({
          where: {
            email_teamId: {
              teamId,
              email,
            },
          },
        });

        if (invitationExists) {
          res.status(400).json("Invitation already sent to this email");
          return;
        }

        const token = newId("inv");
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 168); // 7 days // invitation expires in 24 hour

        // create invitation
        await prisma.invitation.create({
          data: {
            email,
            token,
            expires: expiresAt,
            teamId,
          },
        });

        await prisma.verificationToken.create({
          data: {
            token: hashToken(token),
            identifier: email,
            expires: expiresAt,
          },
        });

        // send invite email
        const sender = req.user;

        // invitation acceptance URL
        const invitationUrl = `/api/teams/${teamId}/invitations/accept?token=${token}&email=${email}`;
        const fullInvitationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${invitationUrl}`;

        // magic link
        const magicLinkParams = new URLSearchParams({
          email,
          token,
          callbackUrl: fullInvitationUrl,
        });

        const magicLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/email?${magicLinkParams.toString()}`;

        const verifyParams = new URLSearchParams({
          verification_url: magicLink,
          email,
          token,
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
          teamName: team?.name || "",
          to: email,
          url: verifyUrl,
        });

        res.status(200).json("Invitation sent!");
        return;
      } catch (error) {
        errorhandler(error, res);
      }
    },
  },
  {
    requireAdmin: true,
  },
);
