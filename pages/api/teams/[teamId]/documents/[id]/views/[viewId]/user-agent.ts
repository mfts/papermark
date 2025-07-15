import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getViewUserAgent, getViewUserAgent_v2 } from "@/lib/tinybird";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/documents/:id/views/:viewId/user-agent
    const { id: docId, viewId } = req.query as {
      id: string;
      viewId: string;
    };

    try {
      // Check if team plan includes "free" - this is the business logic
      if (req.team?.plan?.includes("free")) {
        res.status(403).end("Forbidden");
        return;
      }

      let userAgent: {
        rows?: number | undefined;
        data: {
          country: string;
          city: string;
          browser: string;
          os: string;
          device: string;
        }[];
      };

      userAgent = await getViewUserAgent({
        viewId: viewId,
      });

      if (!userAgent || userAgent.rows === 0) {
        userAgent = await getViewUserAgent_v2({
          documentId: docId,
          viewId: viewId,
          since: 0,
        });
      }

      const userAgentData = userAgent.data[0];
      // Include country and city for business and datarooms plans
      if (
        req.team?.plan?.includes("business") ||
        req.team?.plan?.includes("datarooms")
      ) {
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
