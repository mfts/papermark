import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/datarooms/:id/viewers
    const { id: dataroomId } = req.query as {
      id: string;
    };

    try {
      const viewers = await prisma.viewer.findMany({
        where: {
          teamId: req.team!.id,
          views: {
            some: {
              dataroomId: dataroomId,
              viewType: "DATAROOM_VIEW",
            },
          },
        },
        select: {
          id: true,
          teamId: true,
          email: true,
          verified: true,
          views: {
            where: {
              dataroomId: dataroomId,
              viewType: "DATAROOM_VIEW",
            },
            orderBy: {
              viewedAt: "desc",
            },
          },
        },
      });

      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: req.team!.id,
        },
        select: {
          name: true,
        },
      });

      const users = await prisma.user.findMany({
        where: {
          teams: {
            some: {
              teamId: req.team!.id,
            },
          },
        },
        select: {
          email: true,
        },
      });

      const returnViews = viewers.map((viewer) => {
        return {
          ...viewer,
          dataroomName: dataroom?.name,
          lastViewedAt:
            viewer.views.length > 0 ? viewer.views[0].viewedAt : null,
          internal: users.some((user) => user.email === viewer.email), // set internal to true if view.viewerEmail is in the users list
        };
      });

      res.status(200).json(returnViews);
    } catch (error) {
      log({
        message: `Failed to get viewers for dataroom: _${dataroomId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${req.team!.id}, userId: ${req.user.id}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  },
});
