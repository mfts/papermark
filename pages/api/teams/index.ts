import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";
import { errorHanlder } from "@/lib/errorHandler";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // GET /api/teams
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    try {
      const userTeams = await prisma.userTeam.findMany({
        where: {
          userId: (session.user as CustomUser).id,
        },
        include: {
          team: {
            include: {
              users: {
                select: {
                  userId: true,
                  role: true,
                },
              },
              documents: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      const teams = userTeams.map((userTeam) => userTeam.team);
      return res.status(200).json(teams);
    } catch (error) {
      log(`Failed to add domain. Error: \n\n ${error}`);
      errorHanlder(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { team } = req.body;

    try {
      const newTeam = await prisma.team.create({
        data: {
          name: team,
          users: {
            create: {
              userId: (session.user as CustomUser).id,
              role: "ADMIN",
            },
          },
        },
        include: {
          users: true,
        },
      });

      return res.status(201).json(newTeam);
    } catch (error) {
      log(`Failed to add domain. Error: \n\n ${error}`);
      errorHanlder(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
