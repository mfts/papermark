import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const {
      teamId,
      id: dataroomId,
      viewId,
    } = req.query as {
      teamId: string;
      id: string;
      viewId: string;
    };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
        select: {
          id: true,
          plan: true,
        },
      });

      if (!team) {
        res.status(401).end("Unauthorized");
        return;
      }

      if (team.plan.includes("free")) {
        res.status(403).end("Forbidden");
        return;
      }

      const customFields = await prisma.customFieldResponse.findFirst({
        where: {
          viewId: viewId,
          view: {
            dataroomId: dataroomId,
          },
        },
        select: {
          data: true,
        },
      });

      const data = customFields?.data;

      res.status(200).json(data);
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
