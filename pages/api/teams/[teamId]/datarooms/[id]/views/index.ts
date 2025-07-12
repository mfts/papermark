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
    // GET /api/teams/:teamId/datarooms/:id/views
    const { id: dataroomId } = req.query as {
      id: string;
    };

    try {
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: req.team!.id,
        },
        select: {
          id: true,
          teamId: true,
          name: true,
          views: {
            where: {
              viewType: "DATAROOM_VIEW",
            },
            orderBy: {
              viewedAt: "desc",
            },
            include: {
              link: {
                select: {
                  name: true,
                },
              },
              agreementResponse: {
                select: {
                  id: true,
                  agreementId: true,
                  agreement: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
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

      const views = dataroom?.views || [];

      const returnViews = views.map((view) => {
        return {
          ...view,
          dataroomName: dataroom?.name,
          internal: users.some((user) => user.email === view.viewerEmail), // set internal to true if view.viewerEmail is in the users list
        };
      });

      res.status(200).json(returnViews);
    } catch (error) {
      log({
        message: `Failed to get views for dataroom: _${dataroomId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${req.team!.id}, userId: ${req.user.id}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  },
});
