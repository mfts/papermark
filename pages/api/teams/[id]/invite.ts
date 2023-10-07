import { sendEmail } from "@/lib/resend";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // POST /api/teams/:id/invite
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauhorized");
    }

    const { id } = req.query as { id: string };

    const { email } = req.body;

    if (!email) {
      return res.status(400).end("Email is missing in request body");
    }

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: id,
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

      // check that the user is admin of the team, otherwise return 401
      const teamUsers = team?.users;
      const isUserAdmin = teamUsers?.some(
        (user) =>
          user.role === "ADMIN" &&
          user.userId === (session.user as CustomUser).id
      );
      if (!isUserAdmin) {
        return res.status(401).end("Unauthorized to access this team");
      }

      // send invite email
      const sender = session.user as CustomUser;

      sendTeamInviteEmail({
        to: email,
        senderName: sender.name!,
        senderEmail: sender.email!,
        teamName: team?.name!,
        teamId: team?.id!,
      });

      return res.status(200).json("Invitation send!");
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else if (req.method === "GET") {
    // GET /api/teams/:id/invite
    const session = await getServerSession(req, res, authOptions);

    const { id } = req.query as { id: string };

    if (!session) {
      res.redirect(`/login?next=/api/teams/${id}/invite`);
    }

    try {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId: id,
          userId: (session?.user as CustomUser).id,
        },
      });

      if (userTeam) {
        return res.status(400).end("User is already in the team");
      }

      const team = await prisma.team.update({
        where: {
          id: id,
        },
        data: {
          users: {
            create: {
              userId: (session?.user as CustomUser).id,
            },
          },
        },
      });
      return res.redirect(`/teams/${id}`);
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  }
}

export const sendTeamInviteEmail = async ({
  to,
  senderName,
  senderEmail,
  teamName,
  teamId,
}: {
  to: string;
  senderName: string;
  senderEmail: string;
  teamName: string;
  teamId: string;
}) => {
  await sendEmail({
    to: to,
    subject: "You are invited to join a Team",
    text: `You are invited by ${senderName}-(${senderEmail} to join ${teamName}.) 
    please click the link below to accept the invitation. \n\n http://localhost:3000/api/teams/${teamId}/invite`,
  });
};
