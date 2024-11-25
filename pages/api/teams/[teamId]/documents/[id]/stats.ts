import { NextApiRequest, NextApiResponse } from "next";

import { View } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import {
  getTotalAvgPageDuration,
  getTotalDocumentDuration,
} from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/documents/:id/stats
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const {
      teamId,
      id: docId,
      excludeTeamMembers,
    } = req.query as {
      teamId: string;
      id: string;
      excludeTeamMembers?: string;
    };

    const userId = (session.user as CustomUser).id;

    try {
      const document = await prisma.document.findUnique({
        where: {
          id: docId,
          teamId,
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
              teamId: teamId,
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
        return res.status(200).json({
          views: [],
          duration: { data: [] },
          total_duration: 0,
          groupedReactions: [],
        });
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

      return res.status(200).json(stats);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
