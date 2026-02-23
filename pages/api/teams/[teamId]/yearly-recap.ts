import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { LOCALHOST_GEO_DATA, getGeoData } from "@/lib/utils/geo";
import { getYearInReviewStats } from "@/lib/year-in-review/get-stats";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { teamId } = req.query as { teamId: string };
  const year = req.query.year ? parseInt(req.query.year as string) : undefined;

  if (!teamId) {
    return res.status(400).json({ message: "Team ID is required" });
  }

  try {
    const userId = (session.user as CustomUser).id;

    const teamAccess = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });
    if (!teamAccess) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user's geo data from request IP for distance calculation
    const geo = getGeoData(req.headers);
    const userGeo = {
      latitude: geo.latitude || LOCALHOST_GEO_DATA.latitude,
      longitude: geo.longitude || LOCALHOST_GEO_DATA.longitude,
    };

    const stats = await getYearInReviewStats(teamId, year, userGeo);
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching yearly recap stats:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
