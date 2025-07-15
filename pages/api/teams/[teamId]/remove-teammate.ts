import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // DELETE /api/teams/:teamId/remove-teammate
    const { userToBeDeleted } = req.body;

    try {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          teamId: req.team!.id,
        },
      });

      if (!userTeam) {
        res.status(401).json("The teammate isn't the part of this team");
        return;
      }

      if (userTeam?.role === "ADMIN" && userTeam.userId === userToBeDeleted) {
        res.status(401).json("You can't remove the Admin");
        return;
      }

      await Promise.all([
        // update all documents owned by the user to be deleted to be owned by the team
        prisma.document.updateMany({
          where: {
            teamId: req.team!.id,
            ownerId: userToBeDeleted,
          },
          data: {
            ownerId: null,
          },
        }),
        // delete the user from the team
        prisma.userTeam.delete({
          where: {
            userId_teamId: {
              userId: userToBeDeleted,
              teamId: req.team!.id,
            },
          },
        }),
      ]);

      res.status(204).end();
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
