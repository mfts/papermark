import { getServerSession } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { errorhandler } from "@/lib/errorHandler";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { sendTeammateInviteEmail } from "@/lib/emails/send-teammate-invite";
import { newId } from "@/lib/id-helper";

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

    const { email } = req.body as { email: string };

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
        },
        select: {
          token: true,
        },
      });

      // send invite email
      const sender = session.user as CustomUser;

      sendTeammateInviteEmail({
        senderName: sender.name || "",
        senderEmail: sender.email || "",
        teamName: team?.name || "",
        teamId: teamId || "",
        token: invitation?.token || "",
        to: email,
      });

      res.status(200).json("Invitation sent again!");
      return;
    } catch (error) {
      errorhandler(error, res);
    }
  }
}
