import { NextApiResponse } from "next";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/datarooms/:id/groups/:groupId/views
    const {
      teamId,
      id: dataroomId,
      groupId,
    } = req.query as {
      teamId: string;
      id: string;
      groupId: string;
    };
    const userId = req.user.id;

    try {
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
          teamId: teamId,
        },
        select: {
          id: true,
          teamId: true,
          name: true,
          views: {
            where: {
              viewType: "DATAROOM_VIEW",
              groupId: groupId,
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
              teamId: teamId,
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
          internal: users.some((user) => user.email === view.viewerEmail),
        };
      });

      return res.status(200).json(returnViews);
    } catch (error) {
      log({
        message: `Failed to get views for dataroom: _${dataroomId}_. \n\n ${error} \n\n*Metadata*: \`{teamId: ${teamId}, userId: ${userId}}\``,
        type: "error",
      });
      errorhandler(error, res);
    }
  },
});
