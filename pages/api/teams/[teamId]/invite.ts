import { sendEmail } from "@/lib/resend";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { errorHanlder } from "@/lib/errorHandler";
import TeamInvitation from "@/components/emails/team-invitation";

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
      return res.status(400).end("Email is missing in request body");
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
        return res.status(403).end("Unauthorized to access this team");
      }

      // send invite email
      const sender = session.user as CustomUser;

      sendTeamInviteEmail({
        to: email,
        senderName: sender.name || "",
        senderEmail: sender.email || "",
        teamName: team?.name || "",
        teamId: team?.id || "",
      });

      return res.status(200).json("Invitation send!");
    } catch (error) {
      errorHanlder(error, res);
    }
  } else if (req.method === "GET") {
    // GET /api/teams/:teamId/invite
    const session = await getServerSession(req, res, authOptions);

    const { teamId } = req.query as { teamId: string };

    if (!session) {
      res.redirect(`/login?next=/api/teams/${teamId}/invite`);
    }

    try {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId,
          userId: (session?.user as CustomUser).id,
        },
      });

      if (userTeam) {
        return res.status(400).end("User is already in the team");
      }

      const team = await prisma.team.update({
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
    react: TeamInvitation({ senderName, senderEmail, teamName, teamId }),
  });
};
