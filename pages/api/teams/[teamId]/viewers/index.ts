import { NextApiResponse } from "next";

import { Prisma } from "@prisma/client";

import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

export default createTeamHandler({
  GET: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { query, page, pageSize, sortBy, sortOrder } = req.query as {
      query?: string;
      page?: string;
      pageSize?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    const { teamId } = req.query as { teamId: string };

    const currentPage = parseInt(page || "1", 10);
    const limit = Math.min(parseInt(pageSize || "10", 10), 100);
    const offset = (currentPage - 1) * limit;

    const validSortFields = ["lastViewed", "totalVisits"];
    const validSortOrders = ["asc", "desc"];
    const sort = validSortFields.includes(sortBy || "") ? sortBy : "lastViewed";
    const order = validSortOrders.includes(sortOrder || "")
      ? sortOrder
      : "desc";

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
        select: { id: true, plan: true },
      });

      if (!team || team.plan === "free") {
        return res.status(404).json({ error: "Team not found" });
      }

      const searchCondition = query
        ? Prisma.sql`AND LOWER(v.email) LIKE LOWER(${`${query}%`})`
        : Prisma.empty;

      let orderByClause: Prisma.Sql;
      if (sort === "totalVisits") {
        orderByClause =
          order === "desc"
            ? Prisma.sql`"totalVisits" DESC, "createdAt" DESC`
            : Prisma.sql`"totalVisits" ASC, "createdAt" DESC`;
      } else if (sort === "lastViewed") {
        orderByClause =
          order === "desc"
            ? Prisma.sql`"lastViewed" DESC NULLS LAST, "createdAt" DESC`
            : Prisma.sql`"lastViewed" ASC NULLS LAST, "createdAt" DESC`;
      } else {
        orderByClause =
          order === "desc"
            ? Prisma.sql`"createdAt" DESC`
            : Prisma.sql`"createdAt" ASC`;
      }

      const viewersWithStats = (await prisma.$queryRaw`
        WITH viewer_stats AS (
          SELECT 
            v.id,
            v.email,
            v."createdAt",
            v."updatedAt",
            COALESCE(vs.total_visits, 0)::int as "totalVisits",
            vs.last_viewed as "lastViewed"
          FROM "Viewer" v
          LEFT JOIN (
            SELECT 
              "viewerId",
              COUNT(*)::int as total_visits,
              MAX("viewedAt") as last_viewed
            FROM "View"
            WHERE "documentId" IS NOT NULL
            GROUP BY "viewerId"
          ) vs ON v.id = vs."viewerId"
          WHERE v."teamId" = ${teamId}
            ${searchCondition}
        )
        SELECT * FROM viewer_stats
        ORDER BY ${orderByClause}
        LIMIT ${limit}
        OFFSET ${offset}
      `) as Array<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        totalVisits: number;
        lastViewed: Date | null;
      }>;

      const totalCountResult = (await prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM "Viewer" v
        WHERE v."teamId" = ${teamId}
          ${searchCondition}
      `) as Array<{ count: number }>;

      const totalCount = totalCountResult[0]?.count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      const formattedViewers = viewersWithStats.map((viewer) => ({
        id: viewer.id,
        email: viewer.email,
        createdAt: viewer.createdAt,
        updatedAt: viewer.updatedAt,
        totalVisits: viewer.totalVisits,
        lastViewed: viewer.lastViewed,
      }));

      const response = {
        viewers: formattedViewers,
        pagination: {
          currentPage,
          pageSize: limit,
          totalItems: totalCount,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
        sorting: {
          sortBy: sort,
          sortOrder: order,
        },
      };

      res.setHeader(
        "Cache-Control",
        "public, s-maxage=30, stale-while-revalidate=300",
      );

      return res.status(200).json(response);
    } catch (error) {
      errorhandler(error, res);
    }
  },
});
