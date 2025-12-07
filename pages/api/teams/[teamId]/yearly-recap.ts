import { NextApiRequest, NextApiResponse } from "next";

import { getYearInReviewStats } from "@/lib/year-in-review/get-stats";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { teamId } = req.query as { teamId: string };
  const year = req.query.year
    ? parseInt(req.query.year as string)
    : undefined;

  if (!teamId) {
    return res.status(400).json({ message: "Team ID is required" });
  }

  try {
    const stats = await getYearInReviewStats(teamId, year);
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching yearly recap stats:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

