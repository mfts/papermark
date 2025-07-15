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
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: {
          id: true,
          subscriptionId: true,
          startsAt: true,
          endsAt: true,
          plan: true,
          _count: {
            select: {
              documents: true,
            },
          },
        },
      });
      if (!team) {
        return res.status(400).json({ error: "Team does not exists" });
      }
      return res.status(200).json(team);
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
