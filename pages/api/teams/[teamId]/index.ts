import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { authOptions } from "../../auth/[...nextauth]";
import { errorHanlder } from "@/lib/errorHandler";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId } = req.query as { teamId: string };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        select: {
          id: true,
          name: true,
          users: {
            select: {
              role: true,
              teamId: true,
              userId: true,
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
          documents: {
            select: {
              owner: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
          },
        },
      });

      // check that the user is member of the team, otherwise return 403
      const teamUsers = team?.users;
      const isUserPartOfTeam = teamUsers?.some(
        (user) => user.userId === (session.user as CustomUser).id
      );
      if (!isUserPartOfTeam) {
        return res.status(403).end("Unauthorized to access this team");
      }

      return res.status(200).json(team);
    } catch (error) {
      errorHanlder(error, res);
    }
  }
}
