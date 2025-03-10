import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

import { hashToken } from "@/lib/api/auth/token";
import { sendTeammateInviteEmail } from "@/lib/emails/send-teammate-invite";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PUT") {
    // PUT /api/teams/:teamId/invitations/resend
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauhorized");
      return;
    }

    const { teamId } = req.query as { teamId: string };

    const { email, role, dataroomId } = req.body as {
      email: string;
      role: "DATAROOM_MEMBER" | "MEMBER" | "MANAGER";
      dataroomId: string[];
    };

    try {
      // check if currentUser is part of the team with the teamId
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId,
          userId: (session.user as CustomUser).id,
        },
      });

      if (!userTeam) {
        res.status(403).json("You are not part of this team");
        return;
      }

      const isUserAdmin = userTeam.role === "ADMIN";
      if (!isUserAdmin) {
        res.status(403).json("Only admins can resend the invitation!");
        return;
      }

      // get current team
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        select: {
          name: true,
        },
      });

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // invitation expires in 24 hour

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
          dataroomId: dataroomId,
          role: role,
        },
        select: {
          token: true,
        },
      });

      const verificationTokenRecord = await prisma.verificationToken.findUnique(
        {
          where: { token: hashToken(invitation.token) },
        },
      );

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
      const sender = session.user as CustomUser;

      const params = new URLSearchParams({
        callbackUrl: `${process.env.NEXTAUTH_URL}/api/teams/${teamId}/invitations/accept`,
        email,
        token: invitation.token,
      });

      const url = `${process.env.NEXTAUTH_URL}/api/auth/callback/email?${params}`;

      sendTeammateInviteEmail({
        senderName: sender.name || "",
        senderEmail: sender.email || "",
        teamName: team?.name || "",
        to: email,
        url: url,
      });

      res.status(200).json("Invitation sent again!");
      return;
    } catch (error) {
      errorhandler(error, res);
    }
  }
}
