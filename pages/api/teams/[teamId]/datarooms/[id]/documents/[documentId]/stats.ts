import { NextApiResponse } from "next";

import { View } from "@prisma/client";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import { getTotalAvgPageDuration } from "@/lib/tinybird";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // GET /api/teams/:teamId/datarooms/:id/documents/:documentId/stats
    const {
      teamId,
      id: dataroomId,
      documentId,
    } = req.query as {
      teamId: string;
      id: string;
      documentId: string;
    };


    try {
      // Verify the document exists in the dataroom
      const dataroomDocument = await prisma.dataroomDocument.findFirst({
        where: {
          dataroomId,
          document: {
            id: documentId,
            teamId,
          },
        },
        include: {
          document: {
            include: {
              versions: {
                take: 1,
                where: {
                  isPrimary: true,
                },
                select: {
                  versionNumber: true,
                  numPages: true,
                },
              },
              team: {
                select: {
                  plan: true,
                },
              },
            },
          },
        },
      });

      if (!dataroomDocument) {
        return res.status(404).json({
          error: "Document not found in this dataroom",
        });
      }

      // Get all views for this document that are specifically from the dataroom
      const views = await prisma.view.findMany({
        where: {
          documentId: documentId,
        },
      });

      // if there are no views, return an empty array
      if (!views || views.length === 0) {
        return res.status(200).json({
          views: [],
          duration: { data: [] },
          total_duration: 0,
          groupedReactions: [],
          totalViews: 0,
          totalPagesMax: 0,
        });
      }

      const activeViews = views.filter((view) => !view.isArchived);
      const archivedViews = views.filter((view) => view.isArchived);
      const nonDataroomViews = activeViews.filter(
        (view) => view.dataroomId !== dataroomId,
      );

      // exclude views from the team's members if requested
      let internalViews: View[] = [];

      // combined archived and internal and non-dataroom views
      const allExcludedViews = [
        ...internalViews,
        ...archivedViews,
        ...nonDataroomViews,
      ];

      // filter out the excluded views
      const filteredViews = views
        .filter(
          (view) => !allExcludedViews.map((view) => view.id).includes(view.id),
        )
        .map((view) => ({
          id: view.id,
        }));

      const duration = await getTotalAvgPageDuration({
        documentId: documentId,
        excludedLinkIds: "",
        excludedViewIds: allExcludedViews.map((view) => view.id).join(","),
        since: 0,
      });

      const stats = {
        views: filteredViews,
        duration,
        total_duration: 0, // INFO: hiding this for now
        groupedReactions: [], // INFO: hiding this as not relevant
        totalViews: filteredViews.length,
        completionRate: 0,
        totalPagesMax: dataroomDocument.document.versions[0].numPages,
      };

      return res.status(200).json(stats);
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
