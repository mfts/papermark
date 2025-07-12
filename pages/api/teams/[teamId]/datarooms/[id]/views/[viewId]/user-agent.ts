import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getViewUserAgent } from "@/lib/tinybird";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { teamId, viewId } = req.query as {
      teamId: string;
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
      const userAgent = await getViewUserAgent({
        viewId: viewId,
      });

      const userAgentData = userAgent.data[0];

      if (!userAgentData) {
        res.status(404).end("No user agent data found");
        return;
      }

      // Include country and city for business and datarooms plans
      if (team.plan.includes("business") || team.plan.includes("datarooms")) {
        res.status(200).json(userAgentData);
      } else {
        // For other plans, exclude country and city
        const { country, city, ...remainingResponse } = userAgentData;
        res.status(200).json(remainingResponse);
      }
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
