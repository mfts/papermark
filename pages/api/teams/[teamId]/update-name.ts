import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler(
  {
    PATCH: async (req: AuthenticatedRequest, res: NextApiResponse) => {
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

        // update name
        await prisma.team.update({
          where: {
            id: teamId,
          },
          data: {
            name: req.body.name,
          },
        });

        return res.status(200).json("Team name updated!");
      } catch (error) {
        return res.status(500).json((error as Error).message);
      }
    },
  },
  {
    requireAdmin: true,
  },
);
