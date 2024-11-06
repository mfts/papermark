import { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/join-link/accept
    const session = await getServerSession(req, res, authOptions);

    const { joinCode } = req.query as { joinCode: string };

    if (!session) {
      res.redirect(`/login?next=/api/teams/join-link/accept?joinCode=${joinCode}`);
      return;
    }

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: { joinCode },
        select: { id: true },
      });

      if (!team) {
        return res.status(404).json("Invalid join link");
      }

      const teamId = team.id;

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

      await identifyUser(session.user?.email ?? "");
      await trackAnalytics({
        event: "Team Member Invitation Accepted",
        teamId: teamId,
      });

      return res.redirect(`/documents`);
    } catch (error) {
      errorhandler(error, res);
    }
  }
}

