import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getTotalTeamDuration } from "@/lib/tinybird/pipes";

import { COUNTRIES } from "../constants";

export async function getYearInReviewStats(teamId: string, year?: number) {
  const currentYear = year || new Date().getFullYear();
  const yearStart = new Date(`${currentYear}-01-01`);
  const yearEnd = new Date(`${currentYear + 1}-01-01`);

  // Run all queries in parallel for a specific team
  const [
    documents,
    teamCounts,
    mostViewedDoc,
    mostActiveMonth,
    dataroomCounts,
    mostActiveViewer,
  ] = await Promise.all([
    prisma.document.findMany({
      where: { teamId },
      select: { id: true },
    }),

    // 1. Total documents, links, and views for the year
    prisma.team.findUnique({
      where: { id: teamId },
      select: {
        _count: {
          select: {
            documents: {
              where: {
                createdAt: {
                  gte: yearStart,
                  lt: yearEnd,
                },
              },
            },
            links: {
              where: {
                createdAt: {
                  gte: yearStart,
                  lt: yearEnd,
                },
              },
            },
            views: {
              where: {
                viewedAt: {
                  gte: yearStart,
                  lt: yearEnd,
                },
                isArchived: false,
              },
            },
          },
        },
      },
    }),

    // 2. Most viewed document
    prisma.$queryRaw<
      Array<{ documentId: string; documentName: string; viewCount: number }>
    >(Prisma.sql`
      WITH RankedDocuments AS (
        SELECT 
          d."id" as "documentId",
          d."name" as "documentName",
          COUNT(v."id") as "viewCount",
          ROW_NUMBER() OVER (ORDER BY COUNT(v."id") DESC) as rn
        FROM "Document" d
        LEFT JOIN "View" v ON v."documentId" = d."id"
        WHERE 
          d."teamId" = ${teamId}
          AND v."viewedAt" >= ${yearStart}
          AND v."viewedAt" < ${yearEnd}
          AND v."isArchived" = false
        GROUP BY d."id", d."name"
      )
      SELECT 
        "documentId",
        "documentName",
        "viewCount"
      FROM RankedDocuments
      WHERE rn = 1
      LIMIT 1
    `),

    // 3. Most active month
    prisma.$queryRaw<Array<{ month: Date; viewCount: number }>>(Prisma.sql`
      WITH MonthlyViews AS (
        SELECT 
          DATE_TRUNC('month', "viewedAt") as month,
          COUNT(*) as "viewCount",
          ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
        FROM "View"
        WHERE 
          "teamId" = ${teamId}
          AND "viewedAt" >= ${yearStart}
          AND "viewedAt" < ${yearEnd}
          AND "isArchived" = false
        GROUP BY DATE_TRUNC('month', "viewedAt")
      )
      SELECT month, "viewCount"
      FROM MonthlyViews
      WHERE rn = 1
      LIMIT 1;
    `),

    // 4. Total datarooms for the year
    prisma.dataroom.count({
      where: {
        teamId,
        createdAt: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
    }),

    // 5. Most active viewer (person who viewed most)
    prisma.$queryRaw<
      Array<{
        viewerEmail: string;
        viewerName: string | null;
        viewCount: number;
      }>
    >(Prisma.sql`
      WITH RankedViewers AS (
        SELECT 
          v."viewerEmail",
          v."viewerName",
          COUNT(*) as "viewCount",
          ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
        FROM "View" v
        WHERE 
          v."teamId" = ${teamId}
          AND v."viewedAt" >= ${yearStart}
          AND v."viewedAt" < ${yearEnd}
          AND v."isArchived" = false
          AND v."viewerEmail" IS NOT NULL
        GROUP BY v."viewerEmail", v."viewerName"
      )
      SELECT 
        "viewerEmail",
        "viewerName",
        "viewCount"
      FROM RankedViewers
      WHERE rn = 1
      LIMIT 1
    `),
  ]);

  // skip if no documents
  if (documents.length === 0) {
    return {
      year: currentYear,
      totalDocuments: teamCounts?._count.documents || 0,
      totalLinks: teamCounts?._count.links || 0,
      totalViews: teamCounts?._count.views || 0,
      totalDatarooms: dataroomCounts || 0,
      mostViewedDocument: null,
      mostActiveMonth: null,
      mostActiveViewer: null,
      totalDuration: 0,
      uniqueCountries: [],
    };
  }

  // get total duration for all documents in the team
  const tinybirdData = await getTotalTeamDuration({
    documentIds: documents.map((doc) => doc.id).join(","),
    since: yearStart.getTime(),
    until: yearEnd.getTime(),
  });

  // write full name of countries
  const uniqueCountries = tinybirdData.data[0]?.unique_countries?.map(
    (country: string) => {
      // Map country codes to full names using COUNTRIES constant
      return COUNTRIES[country] || country;
    },
  ) || [];

  return {
    year: currentYear,
    totalDocuments: teamCounts?._count.documents || 0,
    totalLinks: teamCounts?._count.links || 0,
    totalViews: teamCounts?._count.views || 0,
    totalDatarooms: dataroomCounts || 0,
    mostViewedDocument: mostViewedDoc[0]
      ? {
          documentId: mostViewedDoc[0].documentId,
          documentName: mostViewedDoc[0].documentName,
          viewCount: Number(mostViewedDoc[0].viewCount),
        }
      : null,
    mostActiveMonth: mostActiveMonth?.[0]
      ? {
          month: new Date(mostActiveMonth[0].month).toLocaleString("en-US", {
            month: "long",
          }),
          viewCount: Number(mostActiveMonth[0].viewCount),
        }
      : null,
    mostActiveViewer: mostActiveViewer?.[0]
      ? {
          email: mostActiveViewer[0].viewerEmail,
          name: mostActiveViewer[0].viewerName,
          viewCount: Number(mostActiveViewer[0].viewCount),
        }
      : null,
    totalDuration: tinybirdData.data[0]?.total_duration || 0,
    uniqueCountries: uniqueCountries,
  };
}
