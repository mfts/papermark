import { Tinybird } from "@chronark/zod-bird";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

import { COUNTRIES } from "../constants";

export async function getYearInReviewStats(teamId: string) {
  // Run all queries in parallel for a specific team
  const [documents, teamCounts, mostViewedDoc, mostActiveMonth] =
    await Promise.all([
      prisma.document.findMany({
        where: { teamId },
        select: { id: true },
      }),

      // 1. Total documents uploaded in 2024
      prisma.team.findUnique({
        where: { id: teamId },
        select: {
          _count: {
            select: {
              documents: {
                where: {
                  createdAt: {
                    gte: new Date("2024-01-01"),
                    lt: new Date("2024-12-01"),
                  },
                },
              },
              links: {
                where: {
                  createdAt: {
                    gte: new Date("2024-01-01"),
                    lt: new Date("2024-12-01"),
                  },
                },
              },
              views: {
                where: {
                  viewedAt: {
                    gte: new Date("2024-01-01"),
                    lt: new Date("2024-12-01"),
                  },
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
          AND v."viewedAt" >= '2024-01-01' 
          AND v."viewedAt" < '2024-12-01'
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
          AND "viewedAt" >= '2024-01-01'
          AND "viewedAt" < '2024-12-01'
        GROUP BY DATE_TRUNC('month', "viewedAt")
      )
      SELECT month, "viewCount"
      FROM MonthlyViews
      WHERE rn = 1
      LIMIT 1;
    `),
    ]);

  // skip if no documents
  if (documents.length === 0) {
    return {
      totalDocuments: teamCounts?._count.documents,
      totalLinks: teamCounts?._count.links,
      totalViews: teamCounts?._count.views,
    };
  }

  // get total duration for all documents in the team
  const tinybirdData = await getTotalDuration({
    documentIds: documents.map((doc) => doc.id).join(","),
  });

  // write full name of countries
  const uniqueCountries = tinybirdData.data[0].unique_countries.map(
    (country) => {
      // Map country codes to full names using COUNTRIES constant
      return COUNTRIES[country] || country;
    },
  );

  return {
    totalDocuments: teamCounts?._count.documents,
    totalLinks: teamCounts?._count.links,
    totalViews: teamCounts?._count.views,
    mostViewedDocument: mostViewedDoc[0]
      ? {
          documentId: mostViewedDoc[0].documentId,
          documentName: mostViewedDoc[0].documentName,
          viewCount: mostViewedDoc[0].viewCount,
        }
      : null,
    mostActiveMonth: mostActiveMonth?.[0]
      ? {
          month: new Date(mostActiveMonth[0].month).toLocaleString("en-US", {
            month: "long",
          }),
          viewCount: mostActiveMonth[0].viewCount,
        }
      : null,
    totalDuration: tinybirdData.data[0].total_duration,
    uniqueCountries: uniqueCountries,
  };
}

const tb = new Tinybird({ token: process.env.TINYBIRD_TOKEN! });

// tinybird pipe to get the total view duration for all documents in a team
export const getTotalDuration = tb.buildPipe({
  pipe: "get_total_team_duration__v1",
  parameters: z.object({
    documentIds: z.string().describe("Comma separated documentIds"),
  }),
  data: z.object({
    total_duration: z.number(),
    unique_countries: z.array(z.string()),
  }),
});
