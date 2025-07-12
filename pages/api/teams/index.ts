import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default createAuthenticatedHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const user = req.user as CustomUser;

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
          },
        });
        teams.push(defaultTeam);
      }

      res.status(200).json(teams);
      return;
    } catch (error) {
      log({
        message: `Failed to find team for user: _${user.id}_ \n\n ${error}`,
        type: "error",
      });
      errorhandler(error, res);
      return;
    }
  },

  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { team } = req.body;
    const user = req.user as CustomUser;

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

      res.status(201).json(newTeam);
      return;
    } catch (error) {
      log({
        message: `Failed to create team "${team}" for user: _${user.id}_. \n\n*Error*: \n\n ${error}`,
        type: "error",
      });
      errorhandler(error, res);
      return;
    }
  },
});
