import { NextApiResponse } from "next";

import { View } from "@prisma/client";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import {
  getTotalAvgPageDuration,
  getTotalDocumentDuration,
} from "@/lib/tinybird";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/documents/:id/stats
    const { id: docId, excludeTeamMembers } = req.query as {
      id: string;
      excludeTeamMembers?: string;
    };

    try {
      const document = await prisma.document.findUnique({
        where: {
          id: docId,
          teamId: req.team?.id,
        },
        include: {
          views: true,
          team: {
            select: {
              plan: true,
            },
          },
        },
      });

      const users = await prisma.user.findMany({
        where: {
          teams: {
            some: {
              teamId: req.team?.id,
            },
          },
        },
        select: {
          email: true,
        },
      });

      const views = document?.views;

      // if there are no views, return an empty array
      if (!views) {
        res.status(200).json({
          views: [],
          duration: { data: [] },
          total_duration: 0,
          groupedReactions: [],
        });
        return;
      }

      const activeViews = views.filter((view) => !view.isArchived);
      const archivedViews = views.filter((view) => view.isArchived);

      // exclude views from the team's members
      let internalViews: View[] = [];
      if (excludeTeamMembers) {
        internalViews = activeViews.filter((view) => {
          return users.some((user) => user.email === view.viewerEmail);
        });
      }

      // combined archived and internal views
      const allExcludedViews = [...internalViews, ...archivedViews];

      // filter out the excluded views
      const filteredViews = views.filter(
        (view) => !allExcludedViews.map((view) => view.id).includes(view.id),
      );

      // get the reactions for the filtered views
      const groupedReactions = await prisma.reaction.groupBy({
        by: ["type"],
        where: {
          view: {
            documentId: docId,
            id: { notIn: allExcludedViews.map((view) => view.id) },
          },
        },
        _count: { type: true },
      });

      const duration = await getTotalAvgPageDuration({
        documentId: docId,
        excludedLinkIds: "",
        excludedViewIds: allExcludedViews.map((view) => view.id).join(","),
        since: 0,
      });

      const totalDocumentDuration = await getTotalDocumentDuration({
        documentId: docId,
        excludedLinkIds: "",
        excludedViewIds: allExcludedViews.map((view) => view.id).join(","),
        since: 0,
      });

      const stats = {
        views: filteredViews,
        duration,
        total_duration:
          (totalDocumentDuration.data[0].sum_duration * 1.0) /
          filteredViews.length,
        groupedReactions,
        totalViews: filteredViews.length,
      };

      res.status(200).json(stats);
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
