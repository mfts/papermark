import { NextApiResponse } from "next";

import { addDays } from "date-fns";
import { z } from "zod";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";
import {
  getTotalDocumentDuration,
  getTotalLinkDuration,
  getTotalViewerDuration,
  getViewPageDuration,
} from "@/lib/tinybird/pipes";
import { CustomUser } from "@/lib/types";
import { durationFormat } from "@/lib/utils";

const analyticsQuerySchema = z.object({
  interval: z.enum(["24h", "7d", "30d", "custom"]),
  type: z.enum(["overview", "links", "documents", "visitors", "views"]),
  teamId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const INTERVALS = {
  "24h": 24 * 60 * 60 * 1000, // 24 hours in ms
  "7d": 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  "30d": 30 * 24 * 60 * 60 * 1000, // 30 days in ms
} as const;

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const result = analyticsQuerySchema.safeParse(req.query);

      if (!result.success) {
        res
          .status(400)
          .json({ error: `Invalid body: ${result.error.message}` });
        return;
      }

      const {
        interval,
        type,
        teamId,
        startDate: startStr,
        endDate: endStr,
      } = result.data;

      const team = req.team;

      // Check if free plan user is trying to access data beyond 30 days
      if (interval === "custom" && team.plan.includes("free")) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        // For custom range, check the provided start date
        if (startStr && new Date(startStr) < thirtyDaysAgo) {
          res.status(401).json({
            error: "Free plan users can only access data from the last 30 days",
          });
          return;
        }
      }

      // get the start date for the interval
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (interval) {
        case "24h":
          // Get start of the hour 23 hours ago plus current hour = 24h
          startDate = new Date(now);
          startDate.setHours(startDate.getHours() - 23);
          startDate.setMinutes(0, 0, 0);
          break;
        case "7d":
          // Get start of the day 6 days ago plus current day = 7d
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "30d":
          // Get start of the day 29 days ago plus current day = 30d
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 29);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "custom":
          startDate = new Date(startStr || addDays(new Date(), -6));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(endStr || now);

          if (startDate > endDate) {
            res
              .status(400)
              .json({ error: "The 'From' date must be before the 'To' date." });
            return;
          }
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 6);
      }

      // Create the interval filter for the query
      const intervalFilter: any = { gte: startDate, lte: endDate };

      let since: number;

      if (interval === "custom") {
        const startTimestamp = startStr ? new Date(startStr).getTime() : NaN;

        if (isNaN(startTimestamp)) {
          since = Date.now();
        } else {
          since = startTimestamp;
        }
      } else {
        since = Date.now() - INTERVALS[interval];
      }

      switch (type) {
        case "overview": {
          const [viewStats, graphData] = await Promise.all([
            // Get view stats with relational counts
            prisma.view.findMany({
              where: {
                teamId,
                viewedAt: intervalFilter,
                isArchived: false,
                viewType: "DOCUMENT_VIEW",
              },
              select: {
                id: true,
                viewerEmail: true,
                linkId: true,
                documentId: true,
                viewerId: true,
              },
            }),
            // Get views data for graph grouped by day
            interval === "24h"
              ? prisma.$queryRaw`
                  SELECT 
                    DATE_TRUNC('hour', "viewedAt") as date,
                    COUNT(*) as views
                  FROM "View"
                  WHERE 
                    "teamId" = ${teamId}
                    AND "viewedAt" >= ${startDate}
                    AND "isArchived" = false
                    AND "viewType" = 'DOCUMENT_VIEW'
                  GROUP BY DATE_TRUNC('hour', "viewedAt")
                  ORDER BY date ASC
                `
              : interval === "custom"
                ? prisma.$queryRaw`
                  SELECT 
                    DATE_TRUNC('day', "viewedAt") as date,
                    COUNT(*) as views
                  FROM "View"
                  WHERE 
                    "teamId" = ${teamId}
                    AND "viewedAt" >= ${startDate}
                    AND "viewedAt" <= ${endDate}
                    AND "isArchived" = false
                    AND "viewType" = 'DOCUMENT_VIEW'
                  GROUP BY DATE_TRUNC('day', "viewedAt")
                  ORDER BY date ASC
                `
                : prisma.$queryRaw`
                  SELECT 
                    DATE_TRUNC('day', "viewedAt") as date,
                    COUNT(*) as views
                  FROM "View"
                  WHERE 
                    "teamId" = ${teamId}
                    AND "viewedAt" >= ${startDate}
                    AND "isArchived" = false
                    AND "viewType" = 'DOCUMENT_VIEW'
                  GROUP BY DATE_TRUNC('day', "viewedAt")
                  ORDER BY date ASC
                `,
          ]);

          // Calculate counts from viewStats
          const uniqueLinks = new Set(viewStats.map((view) => view.linkId));
          const uniqueDocuments = new Set(
            viewStats.map((view) => view.documentId),
          );
          const uniqueVisitors = new Set(
            viewStats.map((view) => view.viewerId),
          );

          res.status(200).json({
            counts: {
              links: uniqueLinks.size,
              documents: uniqueDocuments.size,
              visitors: uniqueVisitors.size,
              views: viewStats.length,
            },
            graph: (graphData as { date: Date; views: bigint }[]).map(
              (point) => ({
                date: point.date,
                views: Number(point.views),
              }),
            ),
          });
          return;
        }

        case "links": {
          const links = await prisma.link.findMany({
            where: {
              teamId,
              isArchived: false,
              views: {
                some: {
                  viewedAt: intervalFilter,
                  viewType: "DOCUMENT_VIEW",
                  isArchived: false,
                },
              },
            },
            select: {
              id: true,
              name: true,
              slug: true,
              domainSlug: true,
              domainId: true,
              documentId: true,
              _count: {
                select: {
                  views: {
                    where: {
                      viewedAt: intervalFilter,
                      viewType: "DOCUMENT_VIEW",
                      isArchived: false,
                    },
                  },
                },
              },
              views: {
                where: {
                  viewedAt: intervalFilter,
                  viewType: "DOCUMENT_VIEW",
                  isArchived: false,
                },
                orderBy: {
                  viewedAt: "desc",
                },
                take: 1,
                select: {
                  viewedAt: true,
                },
              },
              document: {
                select: {
                  name: true,
                  versions: {
                    orderBy: {
                      createdAt: "desc",
                    },
                    take: 1,
                    select: {
                      numPages: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          // Transform the data to match the table requirements
          const transformedLinks = await Promise.all(
            links.map(async (link) => {
              let avgDuration = "0s";

              if (link.documentId) {
                try {
                  const durationData = await getTotalLinkDuration({
                    linkId: link.id,
                    documentId: link.documentId,
                    excludedViewIds: "", // Include all views
                    since,
                    until: endStr
                      ? new Date(endStr).getTime()
                      : new Date().getTime(),
                  });

                  if (durationData.data && durationData.data[0]) {
                    const totalDuration = durationData.data[0].sum_duration;
                    const viewCount = durationData.data[0].view_count;
                    const avgDurationMs = totalDuration / viewCount;
                    avgDuration = durationFormat(avgDurationMs);
                  }
                } catch (error) {
                  console.error("Error fetching Tinybird data:", error);
                }
              }

              return {
                id: link.id,
                name: link.name || `Link #${link.id.slice(-5)}`,
                url: link.domainId
                  ? `https://${link.domainSlug}/${link.slug}`
                  : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${link.id}`,
                documentName: link.document?.name || "Unknown",
                documentId: link.documentId,
                views: link._count.views,
                avgDuration,
                lastViewed: link.views[0]?.viewedAt || null,
              };
            }),
          );

          res.status(200).json(transformedLinks);
          return;
        }

        case "documents": {
          const documents = await prisma.document.findMany({
            where: {
              teamId,
              views: {
                some: {
                  viewedAt: intervalFilter,
                  viewType: "DOCUMENT_VIEW",
                  isArchived: false,
                },
              },
            },
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  views: {
                    where: {
                      viewedAt: intervalFilter,
                      viewType: "DOCUMENT_VIEW",
                      isArchived: false,
                    },
                  },
                },
              },
              views: {
                where: {
                  viewedAt: intervalFilter,
                  viewType: "DOCUMENT_VIEW",
                  isArchived: false,
                },
                orderBy: {
                  viewedAt: "desc",
                },
                take: 1,
                select: {
                  viewedAt: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          // Transform the data to match the table requirements
          const transformedDocuments = await Promise.all(
            documents.map(async (doc) => {
              let avgDuration = "0s";
              try {
                const durationData = await getTotalDocumentDuration({
                  documentId: doc.id,
                  excludedLinkIds: "", // Include all links
                  excludedViewIds: "", // Include all views
                  since,
                  until: endStr
                    ? new Date(endStr).getTime()
                    : new Date().getTime(),
                });

                if (durationData.data && durationData.data[0]) {
                  const totalDuration = durationData.data[0].sum_duration;
                  const avgDurationMs = totalDuration / doc._count.views;
                  avgDuration = durationFormat(avgDurationMs);
                }
              } catch (error) {
                console.error("Error fetching Tinybird data:", error);
              }

              return {
                id: doc.id,
                name: doc.name,
                views: doc._count.views,
                avgDuration,
                lastViewed: doc.views[0]?.viewedAt || null,
              };
            }),
          );

          res.status(200).json(transformedDocuments);
          return;
        }

        case "visitors": {
          const viewers = await prisma.viewer.findMany({
            where: {
              teamId,
              views: {
                some: {
                  viewedAt: intervalFilter,
                  isArchived: false,
                  viewType: "DOCUMENT_VIEW",
                },
              },
            },
            include: {
              views: {
                orderBy: {
                  viewedAt: "desc",
                },
                where: {
                  viewType: "DOCUMENT_VIEW",
                  viewedAt: intervalFilter,
                  isArchived: false,
                },
              },
            },
          });

          // Transform the data to match the table requirements
          const transformedVisitors = await Promise.all(
            viewers.map(async (viewer) => {
              // Get unique documents viewed
              const uniqueDocuments = new Set(
                viewer.views.map((view) => view.documentId),
              );

              let totalDuration = 0;
              try {
                const viewIds = viewer.views.map((view) => view.id).join(",");
                const durationData = await getTotalViewerDuration({
                  viewIds,
                  since,
                  until: endStr
                    ? new Date(endStr).getTime()
                    : new Date().getTime(),
                });

                if (durationData.data && durationData.data[0]) {
                  totalDuration = durationData.data[0].sum_duration;
                }
              } catch (error) {
                console.error("Error fetching Tinybird data:", error);
              }

              return {
                email: viewer.email,
                viewerId: viewer.id,
                totalViews: viewer.views.length,
                lastActive: viewer.views[0]?.viewedAt || new Date(),
                uniqueDocuments: uniqueDocuments.size,
                verified: viewer.verified,
                totalDuration,
              };
            }),
          );

          res.status(200).json(transformedVisitors);
          return;
        }

        case "views": {
          const views = await prisma.view.findMany({
            where: {
              teamId,
              viewedAt: intervalFilter,
              isArchived: false,
              viewType: "DOCUMENT_VIEW",
            },
            include: {
              document: {
                select: {
                  id: true,
                  name: true,
                  versions: {
                    orderBy: {
                      createdAt: "desc",
                    },
                    take: 1,
                    select: {
                      createdAt: true,
                      numPages: true,
                    },
                  },
                },
              },
              link: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              viewedAt: "desc",
            },
          });

          // Transform the data to match the table requirements
          const transformedViews = await Promise.all(
            views.map(async (view) => {
              let totalDuration = 0;
              let completionRate = 0;

              if (view.document?.id) {
                try {
                  const pageData = await getViewPageDuration({
                    documentId: view.document.id,
                    viewId: view.id,
                    since,
                    until: endStr
                      ? new Date(endStr).getTime()
                      : new Date().getTime(),
                  });
                  if (pageData.data && pageData.data.length > 0) {
                    // Calculate total duration from all pages
                    totalDuration = pageData.data.reduce(
                      (sum, page) => sum + page.sum_duration,
                      0,
                    );

                    // Calculate completion rate based on pages with any duration
                    const numPages = view.document.versions[0]?.numPages || 0;
                    completionRate = numPages
                      ? (pageData.data.length / numPages) * 100
                      : 0;
                  }
                } catch (error) {
                  console.error("Error fetching Tinybird data:", error);
                }
              }

              return {
                id: view.id,
                viewerEmail: view.viewerEmail,
                documentName:
                  view.document?.name ||
                  `Document #${view.document?.id.slice(-5)}`,
                linkName: view.link?.name || `Link #${view.link?.id.slice(-5)}`,
                viewedAt: view.viewedAt,
                totalDuration,
                completionRate: Math.round(completionRate),
                verified: view.verified || false,
                documentId: view.document?.id,
                teamId,
              };
            }),
          );

          res.status(200).json(transformedViews);
          return;
        }

        default: {
          res.status(400).json({ error: "Invalid type" });
          return;
        }
      }
    } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.issues });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },
});
