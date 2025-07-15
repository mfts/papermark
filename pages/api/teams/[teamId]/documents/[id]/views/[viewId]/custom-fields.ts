import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/documents/:id/views/:viewId/custom-fields
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

      const customFields = await prisma.customFieldResponse.findFirst({
        where: {
          viewId: viewId,
          view: {
            documentId: docId,
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
