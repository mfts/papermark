import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { View } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import {
  getTotalAvgPageDuration,
  getTotalDocumentDuration,
  getViewPageDuration,
} from "@/lib/tinybird";
import { getVideoEventsByDocument } from "@/lib/tinybird/pipes";
import { CustomUser } from "@/lib/types";

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
      const teamHasUser = await prisma.team.findUnique({
        where: { id: teamId, users: { some: { userId } } },
      });

      if (!teamHasUser) {
        return res.status(401).end("Unauthorized");
      }

      // First check if document exists and get basic info
      const document = await prisma.document.findUnique({
        where: {
          id: docId,
          teamId,
        },
        select: {
          id: true,
          teamId: true,
          numPages: true,
          type: true,
          versions: {
            orderBy: { createdAt: "desc" },
            select: {
              versionNumber: true,
              createdAt: true,
              numPages: true,
              type: true,
              length: true,
            },
          },
          _count: {
            select: {
              views: { where: { isArchived: false } },
            },
          },
        },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Early return for documents with no views - avoid expensive queries
      if (document._count.views === 0) {
        return res.status(200).json({
          views: [],
          duration: { data: [] },
          total_duration: 0,
          avgCompletionRate: 0,
          totalViews: 0,
        });
      }

      // Only fetch views and users if we have views
      const [views, users] = await Promise.all([
        prisma.view.findMany({
          where: {
            documentId: docId,
          },
        }),
        excludeTeamMembers
          ? prisma.user.findMany({
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
            })
          : Promise.resolve([]),
      ]);

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

      const [duration, totalDocumentDuration] = await Promise.all([
        getTotalAvgPageDuration({
          documentId: docId,
          excludedLinkIds: "",
          excludedViewIds: allExcludedViews.map((view) => view.id).join(","),
          since: 0,
        }),
        getTotalDocumentDuration({
          documentId: docId,
          excludedLinkIds: "",
          excludedViewIds: allExcludedViews.map((view) => view.id).join(","),
          since: 0,
        }),
      ]);

      // Calculate average completion rate for all filtered views
      let avgCompletionRate = 0;
      if (filteredViews.length > 0) {
        if (document.type === "video") {
          // For video documents, calculate based on unique watch time
          const videoEvents = await getVideoEventsByDocument({
            document_id: docId,
          });

          const completionRates = await Promise.all(
            filteredViews.map(async (view) => {
              const viewEvents =
                videoEvents?.data.filter(
                  (event: any) =>
                    event.view_id === view.id &&
                    ["played", "muted", "unmuted", "rate_changed"].includes(
                      event.event_type,
                    ) &&
                    event.end_time > event.start_time &&
                    event.end_time - event.start_time >= 1,
                ) || [];

              const uniqueTimestamps = new Set<number>();
              viewEvents.forEach((event: any) => {
                for (let t = event.start_time; t < event.end_time; t++) {
                  uniqueTimestamps.add(Math.floor(t));
                }
              });

              const videoLength = document.versions[0]?.length || 0;
              return videoLength > 0
                ? Math.min(100, (uniqueTimestamps.size / videoLength) * 100)
                : 0;
            }),
          );

          avgCompletionRate =
            completionRates.reduce((sum, rate) => sum + rate, 0) /
            completionRates.length;
        } else {
          // For document (PDF) type, calculate based on pages viewed
          const completionRates = await Promise.all(
            filteredViews.map(async (view) => {
              const pageData = await getViewPageDuration({
                documentId: docId,
                viewId: view.id,
                since: 0,
              });

              const relevantVersion = document.versions.find(
                (version) => version.createdAt <= view.viewedAt,
              );
              const numPages =
                relevantVersion?.numPages || document.numPages || 0;

              return numPages > 0 ? (pageData.data.length / numPages) * 100 : 0;
            }),
          );

          avgCompletionRate =
            completionRates.reduce((sum, rate) => sum + rate, 0) /
            completionRates.length;
        }
      }

      const stats = {
        views: filteredViews,
        duration,
        total_duration:
          (totalDocumentDuration.data[0].sum_duration * 1.0) /
          filteredViews.length,
        avgCompletionRate: Math.round(avgCompletionRate),
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
