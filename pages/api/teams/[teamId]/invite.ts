import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { errorHanlder } from "@/lib/errorHandler";
import { sendTeammateInviteEmail } from "@/lib/emails/send-teammate-invite";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/invite
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauhorized");
    }

    const { teamId } = req.query as { teamId: string };

    const { email } = req.body;

    if (!email) {
      return res.status(400).json("Email is missing in request body");
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
            },
          },
        },
      });

      // check that the user is admin of the team, otherwise return 403
      const teamUsers = team?.users;
      const isUserAdmin = teamUsers?.some(
        (user) =>
          user.role === "ADMIN" &&
          user.userId === (session.user as CustomUser).id
      );
      if (!isUserAdmin) {
        return res.status(403).json("Only admins can send the invitation!");
      }

      const token = randomUUID().toString();

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // invitation expires in 24 hour
      const invitation = await prisma.invitation.create({
        data: {
          email,
          token,
          expires: expiresAt,
          teamId,
        },
      });

      // send invite email
      const sender = session.user as CustomUser;

      sendTeammateInviteEmail({
        to: email,
        senderName: sender.name || "",
        senderEmail: sender.email || "",
        teamName: team?.name || "",
        teamId: team?.id || "",
        token,
      });

      return res.status(200).json("Invitation send!");
    } catch (error) {
      errorHanlder(error, res);
    }
  } else if (req.method === "GET") {
    // GET /api/teams/:teamId/invite
    const session = await getServerSession(req, res, authOptions);

    const { teamId } = req.query as { teamId: string };

    const { token } = req.query as { token: string };

    if (!session) {
      res.redirect(`/login?next=/api/teams/${teamId}/invite?token=${token}`);
    }

    try {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId,
          userId: (session?.user as CustomUser).id,
        },
      });

      if (userTeam) {
        // User is already in the team
        return res.redirect(`/documents`);
      }

      const invitation = await prisma.invitation.findUnique({
        where: {
          token,
        },
      });

      if (!invitation) {
        return res.status(400).json("Invalid invitation token");
      }

      const currentTime = new Date();
      if (currentTime > invitation.expires) {
        return res.status(400).json("Invitation link has expired");
      }

      await prisma.team.update({
        where: {
          id: teamId,
        },
        data: {
          users: {
            create: {
              userId: (session?.user as CustomUser).id,
            },
          },
        },
      });

      return res.redirect("/documents");
    } catch (error) {
      errorHanlder(error, res);
    }
  }
}
