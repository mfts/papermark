import prisma from "@/lib/prisma";

// Function to get total views for all teams and calculate percentiles
export async function calculateViewPercentile(teamTotalViews: number) {
  const allTeamViews = await prisma.$queryRaw<Array<{ total_views: number }>>`
    WITH TeamStats AS (
      SELECT 
        "teamId",
        CAST(stats->>'totalViews' AS INTEGER) as total_views
      FROM "YearInReview"
      WHERE stats->>'totalViews' IS NOT NULL
    )
    SELECT total_views 
    FROM TeamStats 
    ORDER BY total_views DESC
  `;

  // Convert to array of numbers and sort descending
  const viewCounts = allTeamViews
    .map((t) => t.total_views)
    .sort((a, b) => b - a);
  const totalTeams = viewCounts.length;

  if (totalTeams === 0) return 100; // If no other teams, you're at the top

  // Find position of current team
  const position = viewCounts.findIndex((views) => views <= teamTotalViews) + 1;

  // Calculate percentile (position / total * 100)
  const percentile = (position / totalTeams) * 100;

  // Map to predefined brackets
  if (percentile <= 1) return 1;
  if (percentile <= 3) return 3;
  if (percentile <= 5) return 5;
  if (percentile <= 10) return 10;
  if (percentile <= 25) return 25;
  if (percentile <= 50) return 50;
  return 100;
}

// Updated getYearInReviewStats to include percentile
export async function getYearInReviewStats(teamId: string) {
  // Get the team's stats first
  const stats = await prisma.yearInReview.findFirst({
    where: { teamId },
    select: { stats: true },
  });

  if (!stats?.stats) {
    throw new Error("Stats not found for team");
  }

  const parsedStats = stats.stats as any;
  const totalViews = parseInt(parsedStats.totalViews);

  // Calculate the percentile
  const sharerPercentile = await calculateViewPercentile(totalViews);

  // Return stats with percentile
  return {
    ...parsedStats,
    sharerPercentile,
  };
}
