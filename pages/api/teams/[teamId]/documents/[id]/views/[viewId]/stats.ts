import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import { getTeamWithUsersAndDocument } from "@/lib/team/helper";
import { getViewPageDuration } from "@/lib/tinybird";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/documents/:id/views/:viewId/stats
    const {
      teamId,
      id: docId,
      viewId,
    } = req.query as {
      teamId: string;
      id: string;
      viewId: string;
    };

    try {
      await getTeamWithUsersAndDocument({
        teamId,
        userId: req.user.id,
        docId,
        checkOwner: true,
        options: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      });

      const duration = await getViewPageDuration({
        documentId: docId,
        viewId: viewId,
        since: 0,
      });

      const total_duration = duration.data.reduce(
        (totalDuration, data) => totalDuration + data.sum_duration,
        0,
      );

      const stats = { duration, total_duration };

      res.status(200).json(stats);
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
