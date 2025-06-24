import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getDocumentDurationPerViewer } from "@/lib/tinybird";
import { CustomUser } from "@/lib/types";
import { Prisma } from "@prisma/client";

async function fetchAndCacheDurations(
  groupedViews: Array<{ documentId: string; viewIds: string[] }>,
  teamId: string,
  viewerId: string,
  cacheKey: string
): Promise<Record<string, number>> {
  let durationsMap: Record<string, number> = {};
  const cachedDurations = await redis.get(cacheKey);

  if (cachedDurations) {
    const parsedDurations = typeof cachedDurations === 'string' ? JSON.parse(cachedDurations) : cachedDurations;
    durationsMap = parsedDurations;
  } else {
    const batchSize = 5;

    for (let i = 0; i < groupedViews.length; i += batchSize) {
      const batch = groupedViews.slice(i, i + batchSize);

      const batchPromises = batch.map(async (view) => {
        try {
          const durationResult = await getDocumentDurationPerViewer({
            documentId: view.documentId,
            viewIds: view.viewIds.join(","),
          });
          return {
            documentId: view.documentId,
            totalDuration: durationResult.data[0]?.sum_duration || 0,
          };
        } catch (error) {
          console.error(`Error fetching duration for document ${view.documentId}:`, error);
          return {
            documentId: view.documentId,
            totalDuration: 0,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        durationsMap[result.documentId] = result.totalDuration;
      });
    }

    await redis.set(cacheKey, JSON.stringify(durationsMap), { ex: 600 });
  }

  return durationsMap;
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/viewers/:id
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { teamId, id, page, pageSize, sortBy, sortOrder, withDuration } = req.query as {
      teamId: string;
      id: string;
      page?: string;
      pageSize?: string;
      sortBy?: string;
      sortOrder?: string;
      withDuration?: string;
    };

    // Parse pagination parameters
    const currentPage = parseInt(page || "1", 10);
    const limit = parseInt(pageSize || "10", 10);
    const offset = (currentPage - 1) * limit;

    // Parse sorting parameters
    const validSortFields = ["lastViewed", "totalDuration", "viewCount"];
    const validSortOrders = ["asc", "desc"];
    const sort = validSortFields.includes(sortBy || "") ? sortBy : "lastViewed";
    const order = validSortOrders.includes(sortOrder || "") ? sortOrder : "desc";

    const userId = (session.user as CustomUser).id;

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId,
            },
          },
        },
      });

      if (!team || team.plan === "free") {
        return res.status(404).json({ message: "Team not found" });
      }

      const viewer = await prisma.viewer.findUnique({
        where: { id, teamId },
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!viewer) {
        return res.status(404).json({ message: "Viewer not found" });
      }

      // Create cache key for this specific query
      const cacheKey = `viewer-data:${teamId}:${id}:${currentPage}:${limit}:${sort}:${order}`;

      // If withDuration=true, try to get cached data from Redis first
      if (withDuration === "true") {
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
          try {
            const groupedViews = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;

            if (!groupedViews || groupedViews.length === 0) {
              return res.status(200).json({ durations: {} });
            }

            // Try to get cached durations from Redis
            const durationCacheKey = `durations:${teamId}:${id}:${currentPage}:${limit}:${sort}:${order}`;
            const durationsMap = await fetchAndCacheDurations(groupedViews, teamId, id, durationCacheKey);

            return res.status(200).json({ durations: durationsMap });

          } catch (error) {
            console.error("Error processing cached data:", error);
          }
        }
      }

      // Optimize: Use different approaches based on sort type
      let groupedViews: Array<{
        documentId: string;
        viewCount: number;
        lastViewed: Date;
        documentName: string | null;
        documentType: string | null;
        documentContentType: string | null;
        viewIds: string[];
        totalDuration?: number;
      }>;

      const orderDirection = order?.toUpperCase() || "DESC";

      if (sort === "totalDuration") {
        const allDocuments = await prisma.$queryRaw`
          SELECT 
            v."documentId",
            COUNT(v.id)::int as "viewCount",
            MAX(v."viewedAt") as "lastViewed",
            d.name as "documentName",
            d.type as "documentType",
            d."contentType" as "documentContentType",
            ARRAY_AGG(v.id) as "viewIds"
          FROM "View" v
          INNER JOIN "Document" d ON v."documentId" = d.id
          WHERE v."viewerId" = ${id}
            AND v."documentId" IS NOT NULL
          GROUP BY v."documentId", d.name, d.type, d."contentType"
        ` as Array<{
          documentId: string;
          viewCount: number;
          lastViewed: Date;
          documentName: string | null;
          documentType: string | null;
          documentContentType: string | null;
          viewIds: string[];
        }>;

        // Check for cached durations in Redis for totalDuration sorting
        const durationCacheKey = `durations:${teamId}:${id}:all:${sort}:${order}`;
        const durationsMap = await fetchAndCacheDurations(allDocuments, teamId, id, durationCacheKey);

        const documentsWithDurations = allDocuments.map(doc => ({
          ...doc,
          totalDuration: durationsMap[doc.documentId] || 0
        }));

        // Sort by duration
        documentsWithDurations.sort((a, b) => {
          return order === "asc"
            ? a.totalDuration - b.totalDuration
            : b.totalDuration - a.totalDuration;
        });

        // Apply pagination after sorting
        groupedViews = documentsWithDurations.slice(offset, offset + limit);

      } else {
        let orderClause;
        switch (sort) {
          case "lastViewed":
            orderClause = `MAX(v."viewedAt") ${orderDirection === "ASC" ? "ASC" : "DESC"}`;
            break;
          case "viewCount":
            orderClause = `COUNT(v.id) ${orderDirection === "ASC" ? "ASC" : "DESC"}`;
            break;
          default:
            orderClause = `MAX(v."viewedAt") ${orderDirection === "ASC" ? "ASC" : "DESC"}`;
        }

        groupedViews = await prisma.$queryRaw`
          SELECT 
            v."documentId",
            COUNT(v.id)::int as "viewCount",
            MAX(v."viewedAt") as "lastViewed",
            d.name as "documentName",
            d.type as "documentType",
            d."contentType" as "documentContentType",
            ARRAY_AGG(v.id) as "viewIds"
          FROM "View" v
          INNER JOIN "Document" d ON v."documentId" = d.id
          WHERE v."viewerId" = ${id}
            AND v."documentId" IS NOT NULL
          GROUP BY v."documentId", d.name, d.type, d."contentType"
          ORDER BY ${Prisma.raw(orderClause)}
          LIMIT ${limit}
          OFFSET ${offset}
        ` as Array<{
          documentId: string;
          viewCount: number;
          lastViewed: Date;
          documentName: string | null;
          documentType: string | null;
          documentContentType: string | null;
          viewIds: string[];
        }>;
      }

      // Get total count for pagination
      const totalCountResult = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT v."documentId")::int as count
        FROM "View" v
        WHERE v."viewerId" = ${id}
          AND v."documentId" IS NOT NULL
      ` as Array<{ count: number }>;

      const totalItems = totalCountResult[0]?.count || 0;
      const totalPages = Math.ceil(totalItems / limit);

      // Cache the grouped views to Redis (only if not withDuration call)
      if (withDuration !== "true") {
        await redis.set(cacheKey, JSON.stringify(groupedViews), { ex: 300 });
      }

      // If withDuration=true, return only duration data for faster response
      if (withDuration === "true") {
        try {
          const durationCacheKey = `durations:${teamId}:${id}:${currentPage}:${limit}:${sort}:${order}`;
          const durationsMap = await fetchAndCacheDurations(groupedViews, teamId, id, durationCacheKey);

          return res.status(200).json({ durations: durationsMap });

        } catch (error) {
          console.error("Error processing duration batches:", error);
          // Return empty durations on error
          const emptyDurationsMap = Object.fromEntries(
            groupedViews.map(view => [view.documentId, 0])
          );
          return res.status(200).json({ durations: emptyDurationsMap });
        }
      }

      // Standard response without durations
      const formattedViews = groupedViews.map((view) => ({
        documentId: view.documentId,
        viewCount: view.viewCount,
        lastViewed: view.lastViewed,
        document: {
          id: view.documentId,
          name: view.documentName,
          type: view.documentType,
          contentType: view.documentContentType,
        },
        totalDuration: view.totalDuration || 0,
      }));

      const newViewer = {
        ...viewer,
        views: formattedViews,
        pagination: {
          currentPage,
          pageSize: limit,
          totalItems,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
        sorting: {
          sortBy: sort,
          sortOrder: order,
        },
      };

      return res.status(200).json(newViewer);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
