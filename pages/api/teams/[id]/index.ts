import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/teams/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: id,
        },
        include: {
          users: {
            select: {
              userId: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
              role: true,
            },
          },
          documents: {
            select: {
              id: true,
              name: true,
              file: true,
              type: true,
              numPages: true,
              ownerId: true,
              owner: {
                select: {
                  name: true,
                },
              },
              views: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      // check that the user is member of the team, otherwise return 401
      const teamUsers = team?.users;
      const isUserPartOfTeam = teamUsers?.some(
        (team) => team.userId === (session.user as CustomUser).id
      );
      if (!isUserPartOfTeam) {
        return res.status(401).end("Unauthorized to access this team");
      }

      return res.status(200).json(team);
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  }
}
