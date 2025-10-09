import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

import { authOptions } from "../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const user = session.user as CustomUser;

    try {
      const userTeams = await prisma.userTeam.findMany({
        where: {
          userId: user.id,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              plan: true,
              createdAt: true,
              enableExcelAdvancedMode: true,
              replicateDataroomFolders: true,
            },
          },
        },
        orderBy: {
          team: {
            createdAt: "asc",
          },
        },
      });

      const teams = userTeams.map((userTeam) => userTeam.team);

      // if no teams then create a default one
      if (teams.length === 0) {
        const defaultTeamName = user.name
          ? `${user.name}'s Team`
          : "Personal Team";
        const defaultTeam = await prisma.team.create({
          data: {
            name: defaultTeamName,
            users: {
              create: {
                userId: user.id,
                role: "ADMIN",
              },
            },
          },
          select: {
            id: true,
            name: true,
            plan: true,
            createdAt: true,
            enableExcelAdvancedMode: true,
            replicateDataroomFolders: true,
          },
        });
        teams.push(defaultTeam);
      }

      return res.status(200).json(teams);
    } catch (error) {
      log({
        message: `Failed to find team for user: _${user.id}_ \n\n ${error}`,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else if (req.method === "POST") {
    // POST /api/teams
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { team } = req.body;

    const user = session.user as CustomUser;

    try {
      const newTeam = await prisma.team.create({
        data: {
          name: team,
          users: {
            create: {
              userId: user.id,
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
      log({
        message: `Failed to create team "${team}" for user: _${user.id}_. \n\n*Error*: \n\n ${error}`,
        type: "error",
      });
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
