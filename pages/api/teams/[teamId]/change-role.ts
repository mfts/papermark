import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  PUT: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // PUT /api/teams/:teamId/change-role
    const { userToBeChanged, role } = req.body as {
      userToBeChanged: string;
      role: "MEMBER" | "MANAGER";
    };

    try {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId: req.team!.id,
          userId: req.user.id,
        },
      });

      if (!userTeam) {
        res.status(401).json("Unauthorized");
        return;
      }

      if (userTeam?.role === "ADMIN" && userTeam.userId === userToBeChanged) {
        res.status(401).json("You can't change the Admin");
        return;
      }

      await prisma.userTeam.update({
        where: {
          userId_teamId: {
            userId: userToBeChanged,
            teamId: req.team!.id,
          },
        },
        data: {
          role,
        },
      });
      res.status(204).end();
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
