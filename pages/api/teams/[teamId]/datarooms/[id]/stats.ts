import { NextApiResponse } from "next";

import { View } from "@prisma/client";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTotalDataroomDuration } from "@/lib/tinybird";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/documents/:id/stats
    const {
      teamId,
      id: dataroomId,
      excludeTeamMembers,
    } = req.query as {
      teamId: string;
      id: string;
      excludeTeamMembers?: string;
    };

    try {
      const dataroom = await prisma.dataroom.findUnique({
        where: {
          id: dataroomId,
        },
        include: {
          views: true,
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

      const views = dataroom?.views;

      // if there are no views, return an empty array
      if (!views) {
        return res.status(200).json({
          views: [],
          duration: { data: [] },
          total_duration: 0,
          groupedReactions: [],
        });
      }

      const dataroomViews = views.filter(
        (view) => view.viewType === "DATAROOM_VIEW",
      );
      const documentViews = views.filter(
        (view) => view.viewType === "DOCUMENT_VIEW",
      );

      // exclude views from the team's members
      let excludedViews: View[] = [];
      if (excludeTeamMembers) {
        excludedViews = documentViews.filter((view) => {
          return users.some((user) => user.email === view.viewerEmail);
        });
      }

      const filteredViews = documentViews.filter(
        (view) => !excludedViews.map((view) => view.id).includes(view.id),
      );

      const duration = await getTotalDataroomDuration({
        dataroomId: dataroomId,
        excludedLinkIds: [],
        excludedViewIds: excludedViews.map((view) => view.id),
        since: 0,
      });

      const total_duration = duration.data.reduce(
        (totalDuration, data) => totalDuration + data.sum_duration,
        0,
      );

      const stats = {
        dataroomViews: dataroomViews,
        documentViews: documentViews,
        duration: duration.data,
        total_duration,
      };

      return res.status(200).json(stats);
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
