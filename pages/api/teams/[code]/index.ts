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
    // GET /api/teams/:teamId/joincode/:code
    const session = await getServerSession(req, res, authOptions);

    const { teamId, code } = req.query as { teamId: string, code: string };

    if (!session) {
      res.redirect(`/login?next=/api/teams/${teamId}/joincode/${code}`);
      return;
    }

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
      });

      if (!team) {
        return res.status(404).json("Team not found");
      }

      if (team.joinCode !== code) {
        return res.status(403).json("Invalid join code");
      }

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

      await identifyUser((session?.user as CustomUser).email!);
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
