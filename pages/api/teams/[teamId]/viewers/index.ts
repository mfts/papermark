import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { Prisma } from "@prisma/client";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/teams/:teamId/viewers
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { query, page, pageSize, sortBy, sortOrder } = req.query as {
      query?: string;
      page?: string;
      pageSize?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    const { teamId } = req.query as { teamId: string };

    const currentPage = parseInt(page || "1", 10);
    const limit = parseInt(pageSize || "10", 10);
    const offset = (currentPage - 1) * limit;

    const validSortFields = ["lastViewed", "totalVisits"];
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
        return res.status(404).json({ error: "Team not found" });
      }

      const searchCondition = query
        ? Prisma.sql`AND LOWER(v.email) LIKE LOWER(${`%${query}%`})`
        : Prisma.empty;

      let viewers: Array<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        totalVisits: number;
        lastViewed: Date | null;
      }>;

      const getOrderClause = (sortField: string, sortOrder: string): Prisma.Sql => {
        const key = `${sortField}_${sortOrder}`;

        const orderByWhitelist: Record<string, Prisma.Sql> = {
          lastViewed_asc: Prisma.sql`view_stats."lastViewed" ASC NULLS LAST`,
          lastViewed_desc: Prisma.sql`view_stats."lastViewed" DESC NULLS LAST`,
          totalVisits_asc: Prisma.sql`COALESCE(view_stats."totalVisits", 0) ASC, v."createdAt" DESC`,
          totalVisits_desc: Prisma.sql`COALESCE(view_stats."totalVisits", 0) DESC, v."createdAt" DESC`,
        };

        return orderByWhitelist[key] || orderByWhitelist.lastViewed_desc;
      };
      const orderClause = getOrderClause(sort || 'lastViewed', order || 'desc');

      viewers = await prisma.$queryRaw`
        SELECT 
          v.id,
          v.email,
          v."createdAt",
          v."updatedAt",
          COALESCE(view_stats."totalVisits", 0)::int as "totalVisits",
          view_stats."lastViewed"
        FROM "Viewer" v
        LEFT JOIN (
          SELECT 
            "viewerId",
            COUNT(*)::int as "totalVisits",
            MAX("viewedAt") as "lastViewed"
          FROM "View"
          WHERE "documentId" IS NOT NULL
          GROUP BY "viewerId"
        ) view_stats ON v.id = view_stats."viewerId"
        WHERE v."teamId" = ${teamId}
          ${searchCondition}
        ORDER BY ${orderClause}
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      // Get total count for pagination
      const totalCountResult = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM "Viewer" v
        WHERE v."teamId" = ${teamId}
          ${searchCondition}
      ` as Array<{ count: number }>;

      const totalCount = totalCountResult[0]?.count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Return clean, essential data only
      const formattedViewers = viewers.map((viewer) => ({
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

      return res.status(200).json(response);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    // We only allow GET requests
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
