import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { errorhandler } from "@/lib/errorHandler";
import { sendTeammateInviteEmail } from "@/lib/emails/send-teammate-invite";
import { newId } from "@/lib/id-helper";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
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
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      // check that the user is admin of the team, otherwise return 403
      const teamUsers = team?.users;
      const isUserAdmin = teamUsers?.some(
        (user) =>
          user.role === "ADMIN" &&
          user.userId === (session.user as CustomUser).id,
      );
      if (!isUserAdmin) {
        res.status(403).json("Only admins can send the invitation!");
        return;
      }

      // check if user is already in the team
      const isExistingMember = teamUsers?.some(
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
      expiresAt.setHours(expiresAt.getHours() + 24); // invitation expires in 24 hour

      // create invitation
      await prisma.invitation.create({
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
        senderName: sender.name || "",
        senderEmail: sender.email || "",
        teamName: team?.name || "",
        teamId: team?.id || "",
        token,
        to: email,
      });

      return res.status(200).json("Invitation sent!");
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "GET") {
    // GET /api/teams/:teamId/invite
    const session = await getServerSession(req, res, authOptions);

    const { token, teamId } = req.query as {
      token: string;
      teamId: string;
    };

    if (!session) {
      res.redirect(`/login?next=/api/teams/${teamId}/invite?token=${token}`);
      return;
    }

    const userId = (session.user as CustomUser).id;

    try {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId,
          userId,
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

      if (invitation.email !== (session?.user as CustomUser).email) {
        return res.status(403).json("You are not invited to this team");
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
              userId,
            },
          },
        },
      });

      // delete the invitation record after user is successfully added to the team
      await prisma.invitation.delete({
        where: {
          token,
        },
      });

      return res.redirect("/documents");
    } catch (error) {
      errorhandler(error, res);
    }
  }
}
