import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { authOptions } from "../../auth/[...nextauth]";
import { errorhandler } from "@/lib/errorHandler";

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
      errorhandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId } = req.query as { teamId: string };

    try {
      // check if the team exists
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        include: {
          users: true,
        },
      });
      if (!team) {
        return res.status(400).json("Team doesn't exists");
      }

      // check if current user is admin of the team
      const isUserAdmin = team.users.some(
        (user) =>
          user.role === "ADMIN" &&
          user.userId === (session.user as CustomUser).id
      );
      if (!isUserAdmin) {
        return res
          .status(403)
          .json("You are not permitted to perform this action");
      }

      // delete team
      await prisma.team.delete({
        where: {
          id: teamId,
        },
      });

      return res.status(204).end();
    } catch (error) {
      return res.status(500).json((error as Error).message);
    }
  } else {
    // We only allow GET and DELETE requests
    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
