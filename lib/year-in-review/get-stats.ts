import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getTotalTeamDuration } from "@/lib/tinybird/pipes";

import { COUNTRIES } from "../constants";

// Country centroids (latitude, longitude) for distance calculations
const COUNTRY_CENTROIDS: { [key: string]: { lat: number; lng: number } } = {
  AF: { lat: 33.94, lng: 67.71 },
  AL: { lat: 41.15, lng: 20.17 },
  DZ: { lat: 28.03, lng: 1.66 },
  AD: { lat: 42.55, lng: 1.6 },
  AO: { lat: -11.2, lng: 17.87 },
  AR: { lat: -38.42, lng: -63.62 },
  AM: { lat: 40.07, lng: 45.04 },
  AU: { lat: -25.27, lng: 133.78 },
  AT: { lat: 47.52, lng: 14.55 },
  AZ: { lat: 40.14, lng: 47.58 },
  BH: { lat: 25.93, lng: 50.64 },
  BD: { lat: 23.68, lng: 90.36 },
  BY: { lat: 53.71, lng: 27.95 },
  BE: { lat: 50.5, lng: 4.47 },
  BZ: { lat: 17.19, lng: -88.5 },
  BJ: { lat: 9.31, lng: 2.32 },
  BT: { lat: 27.51, lng: 90.43 },
  BO: { lat: -16.29, lng: -63.59 },
  BA: { lat: 43.92, lng: 17.68 },
  BW: { lat: -22.33, lng: 24.68 },
  BR: { lat: -14.24, lng: -51.93 },
  BN: { lat: 4.54, lng: 114.73 },
  BG: { lat: 42.73, lng: 25.49 },
  BF: { lat: 12.24, lng: -1.56 },
  BI: { lat: -3.37, lng: 29.92 },
  KH: { lat: 12.57, lng: 104.99 },
  CM: { lat: 7.37, lng: 12.35 },
  CA: { lat: 56.13, lng: -106.35 },
  CF: { lat: 6.61, lng: 20.94 },
  TD: { lat: 15.45, lng: 18.73 },
  CL: { lat: -35.68, lng: -71.54 },
  CN: { lat: 35.86, lng: 104.2 },
  CO: { lat: 4.57, lng: -74.3 },
  CG: { lat: -0.23, lng: 15.83 },
  CD: { lat: -4.04, lng: 21.76 },
  CR: { lat: 9.75, lng: -83.75 },
  CI: { lat: 7.54, lng: -5.55 },
  HR: { lat: 45.1, lng: 15.2 },
  CU: { lat: 21.52, lng: -77.78 },
  CY: { lat: 35.13, lng: 33.43 },
  CZ: { lat: 49.82, lng: 15.47 },
  DK: { lat: 56.26, lng: 9.5 },
  DO: { lat: 18.74, lng: -70.16 },
  EC: { lat: -1.83, lng: -78.18 },
  EG: { lat: 26.82, lng: 30.8 },
  SV: { lat: 13.79, lng: -88.9 },
  EE: { lat: 58.6, lng: 25.01 },
  ET: { lat: 9.15, lng: 40.49 },
  FI: { lat: 61.92, lng: 25.75 },
  FR: { lat: 46.23, lng: 2.21 },
  GA: { lat: -0.8, lng: 11.61 },
  GE: { lat: 42.32, lng: 43.36 },
  DE: { lat: 51.17, lng: 10.45 },
  GH: { lat: 7.95, lng: -1.02 },
  GR: { lat: 39.07, lng: 21.82 },
  GT: { lat: 15.78, lng: -90.23 },
  HN: { lat: 15.2, lng: -86.24 },
  HK: { lat: 22.4, lng: 114.11 },
  HU: { lat: 47.16, lng: 19.5 },
  IS: { lat: 64.96, lng: -19.02 },
  IN: { lat: 20.59, lng: 78.96 },
  ID: { lat: -0.79, lng: 113.92 },
  IR: { lat: 32.43, lng: 53.69 },
  IQ: { lat: 33.22, lng: 43.68 },
  IE: { lat: 53.41, lng: -8.24 },
  IL: { lat: 31.05, lng: 34.85 },
  IT: { lat: 41.87, lng: 12.57 },
  JM: { lat: 18.11, lng: -77.3 },
  JP: { lat: 36.2, lng: 138.25 },
  JO: { lat: 30.59, lng: 36.24 },
  KZ: { lat: 48.02, lng: 66.92 },
  KE: { lat: -0.02, lng: 37.91 },
  KR: { lat: 35.91, lng: 127.77 },
  KW: { lat: 29.31, lng: 47.48 },
  KG: { lat: 41.2, lng: 74.77 },
  LA: { lat: 19.86, lng: 102.5 },
  LV: { lat: 56.88, lng: 24.6 },
  LB: { lat: 33.85, lng: 35.86 },
  LY: { lat: 26.34, lng: 17.23 },
  LT: { lat: 55.17, lng: 23.88 },
  LU: { lat: 49.82, lng: 6.13 },
  MO: { lat: 22.2, lng: 113.54 },
  MK: { lat: 41.51, lng: 21.75 },
  MG: { lat: -18.77, lng: 46.87 },
  MY: { lat: 4.21, lng: 101.98 },
  MV: { lat: 3.2, lng: 73.22 },
  ML: { lat: 17.57, lng: -4.0 },
  MT: { lat: 35.94, lng: 14.38 },
  MX: { lat: 23.63, lng: -102.55 },
  MD: { lat: 47.41, lng: 28.37 },
  MN: { lat: 46.86, lng: 103.85 },
  ME: { lat: 42.71, lng: 19.37 },
  MA: { lat: 31.79, lng: -7.09 },
  MZ: { lat: -18.67, lng: 35.53 },
  MM: { lat: 21.91, lng: 95.96 },
  NA: { lat: -22.96, lng: 18.49 },
  NP: { lat: 28.39, lng: 84.12 },
  NL: { lat: 52.13, lng: 5.29 },
  NZ: { lat: -40.9, lng: 174.89 },
  NI: { lat: 12.87, lng: -85.21 },
  NE: { lat: 17.61, lng: 8.08 },
  NG: { lat: 9.08, lng: 8.68 },
  NO: { lat: 60.47, lng: 8.47 },
  OM: { lat: 21.51, lng: 55.92 },
  PK: { lat: 30.38, lng: 69.35 },
  PA: { lat: 8.54, lng: -80.78 },
  PY: { lat: -23.44, lng: -58.44 },
  PE: { lat: -9.19, lng: -75.02 },
  PH: { lat: 12.88, lng: 121.77 },
  PL: { lat: 51.92, lng: 19.15 },
  PT: { lat: 39.4, lng: -8.22 },
  PR: { lat: 18.22, lng: -66.59 },
  QA: { lat: 25.35, lng: 51.18 },
  RO: { lat: 45.94, lng: 24.97 },
  RU: { lat: 61.52, lng: 105.32 },
  RW: { lat: -1.94, lng: 29.87 },
  SA: { lat: 23.89, lng: 45.08 },
  SN: { lat: 14.5, lng: -14.45 },
  RS: { lat: 44.02, lng: 21.01 },
  SG: { lat: 1.35, lng: 103.82 },
  SK: { lat: 48.67, lng: 19.7 },
  SI: { lat: 46.15, lng: 14.99 },
  ZA: { lat: -30.56, lng: 22.94 },
  ES: { lat: 40.46, lng: -3.75 },
  LK: { lat: 7.87, lng: 80.77 },
  SE: { lat: 60.13, lng: 18.64 },
  CH: { lat: 46.82, lng: 8.23 },
  TW: { lat: 23.7, lng: 120.96 },
  TJ: { lat: 38.86, lng: 71.28 },
  TZ: { lat: -6.37, lng: 34.89 },
  TH: { lat: 15.87, lng: 100.99 },
  TN: { lat: 33.89, lng: 9.54 },
  TR: { lat: 38.96, lng: 35.24 },
  TM: { lat: 38.97, lng: 59.56 },
  UG: { lat: 1.37, lng: 32.29 },
  UA: { lat: 48.38, lng: 31.17 },
  AE: { lat: 23.42, lng: 53.85 },
  GB: { lat: 55.38, lng: -3.44 },
  US: { lat: 37.09, lng: -95.71 },
  UY: { lat: -32.52, lng: -55.77 },
  UZ: { lat: 41.38, lng: 64.59 },
  VE: { lat: 6.42, lng: -66.59 },
  VN: { lat: 14.06, lng: 108.28 },
  YE: { lat: 15.55, lng: 48.52 },
  ZM: { lat: -13.13, lng: 27.85 },
  ZW: { lat: -19.02, lng: 29.15 },
};

// Haversine formula to calculate distance between two points on Earth
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Default origin (San Francisco) used when user's location is not available
const DEFAULT_ORIGIN = { lat: 37.77, lng: -122.42 };

// Calculate total distance traveled based on unique countries
// Uses the user's current location as the origin point
function calculateTotalDistance(
  countryCodes: string[],
  origin: { lat: number; lng: number },
): number {
  let totalDistance = 0;

  for (const code of countryCodes) {
    const centroid = COUNTRY_CENTROIDS[code];
    if (centroid) {
      totalDistance += calculateDistance(
        origin.lat,
        origin.lng,
        centroid.lat,
        centroid.lng,
      );
    }
  }

  return Math.round(totalDistance);
}

export async function getYearInReviewStats(
  teamId: string,
  year?: number,
  userGeo?: { latitude?: string; longitude?: string },
) {
  const currentYear = year || new Date().getFullYear();
  const yearStart = new Date(`${currentYear}-01-01`);
  const yearEnd = new Date(`${currentYear + 1}-01-01`);

  // First, get team member emails to exclude from "most viewed" and "most active viewer"
  const teamMembers = await prisma.userTeam.findMany({
    where: { teamId },
    select: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  const teamMemberEmails = teamMembers
    .map((member) => member.user.email)
    .filter((email): email is string => email !== null);

  // Run all queries in parallel for a specific team
  const [
    documents,
    links,
    views,
    mostViewedDoc,
    mostActiveMonth,
    dataroomCounts,
    mostActiveViewer,
  ] = await Promise.all([
    prisma.document.findMany({
      where: {
        teamId,
        createdAt: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
      select: {
        id: true,
      },
    }),

    prisma.link.count({
      where: {
        teamId,
        createdAt: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
    }),

    prisma.view.count({
      where: {
        teamId,
        viewedAt: {
          gte: yearStart,
          lt: yearEnd,
        },
        isArchived: false,
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

    // 5. Most active viewer (person who viewed most, excluding team members)
    teamMemberEmails.length > 0
      ? prisma.$queryRaw<
          Array<{
            viewerEmail: string;
            viewerName: string | null;
            viewCount: number;
          }>
        >(Prisma.sql`
      WITH RankedViewers AS (
        SELECT 
          v."viewerEmail",
          MAX(v."viewerName") as "viewerName",
          COUNT(*) as "viewCount",
          ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
        FROM "View" v
        WHERE 
          v."teamId" = ${teamId}
          AND v."viewedAt" >= ${yearStart}
          AND v."viewedAt" < ${yearEnd}
          AND v."isArchived" = false
          AND v."viewerEmail" IS NOT NULL
          AND v."viewerEmail" NOT IN (${Prisma.join(teamMemberEmails)})
        GROUP BY v."viewerEmail"
      )
      SELECT 
        "viewerEmail",
        "viewerName",
        "viewCount"
      FROM RankedViewers
      WHERE rn = 1
      LIMIT 1
    `)
      : prisma.$queryRaw<
          Array<{
            viewerEmail: string;
            viewerName: string | null;
            viewCount: number;
          }>
        >(Prisma.sql`
      WITH RankedViewers AS (
        SELECT 
          v."viewerEmail",
          MAX(v."viewerName") as "viewerName",
          COUNT(*) as "viewCount",
          ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
        FROM "View" v
        WHERE 
          v."teamId" = ${teamId}
          AND v."viewedAt" >= ${yearStart}
          AND v."viewedAt" < ${yearEnd}
          AND v."isArchived" = false
          AND v."viewerEmail" IS NOT NULL
        GROUP BY v."viewerEmail"
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
      totalDocuments: documents.length || 0,
      totalLinks: links || 0,
      totalViews: views || 0,
      totalDatarooms: dataroomCounts || 0,
      mostViewedDocument: null,
      mostActiveMonth: null,
      mostActiveViewer: null,
      totalDuration: 0,
      uniqueCountries: [],
      distanceTraveled: 0,
    };
  }

  // Batch document IDs to avoid URL length limits (max ~100 IDs per request)
  const BATCH_SIZE = 100;
  const documentIds = documents.map((doc) => doc.id);
  const batches: string[][] = [];

  for (let i = 0; i < documentIds.length; i += BATCH_SIZE) {
    batches.push(documentIds.slice(i, i + BATCH_SIZE));
  }

  // Fetch all batches in parallel
  const tinybirdResults = await Promise.all(
    batches.map((batch) =>
      getTotalTeamDuration({
        documentIds: batch.join(","),
        since: yearStart.getTime(),
        until: yearEnd.getTime(),
      }).catch(() => ({ data: [] })),
    ),
  );

  // Aggregate results from all batches
  let totalDuration = 0;
  const allCountries = new Set<string>();

  for (const result of tinybirdResults) {
    if (result.data[0]) {
      totalDuration += result.data[0].total_duration || 0;
      result.data[0].unique_countries?.forEach((country: string) =>
        allCountries.add(country),
      );
    }
  }

  // Get country codes array for distance calculation
  const countryCodes = Array.from(allCountries);

  // Determine origin point from user's IP location or use default
  const parsedLat =
    userGeo?.latitude !== undefined ? Number(userGeo.latitude) : NaN;
  const parsedLng =
    userGeo?.longitude !== undefined ? Number(userGeo.longitude) : NaN;

  const origin =
    Number.isFinite(parsedLat) && Number.isFinite(parsedLng)
      ? { lat: parsedLat, lng: parsedLng }
      : DEFAULT_ORIGIN;

  // Calculate total distance traveled based on IP locations
  const distanceTraveled = calculateTotalDistance(countryCodes, origin);

  // Write full name of countries for display
  const uniqueCountries = countryCodes.map((country: string) => {
    // Map country codes to full names using COUNTRIES constant
    return COUNTRIES[country] || country;
  });

  return {
    year: currentYear,
    totalDocuments: documents.length || 0,
    totalLinks: links || 0,
    totalViews: views || 0,
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
    totalDuration: totalDuration || 0,
    uniqueCountries: uniqueCountries || [],
    distanceTraveled: distanceTraveled || 0,
  };
}
