import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };

    try {
      // get current invitations for the team
      const invitations = await prisma.invitation.findMany({
        where: {
          teamId: teamId,
        },
        select: {
          email: true,
          expires: true,
        },
      });

      if (!invitations) {
        return res.status(404).json("No invitations found for this team");
      }

      res.status(200).json(invitations);
      return;
    } catch (error) {
      errorhandler(error, res);
    }
  },

  DELETE: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId } = req.query as { teamId: string };
    const { email } = req.body as { email: string };

    try {
      // delete invitation
      await prisma.invitation.delete({
        where: {
          email_teamId: {
            teamId: teamId,
            email: email,
          },
        },
      });

      res.status(204).end();
      return;
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
