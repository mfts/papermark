import prisma from "@/lib/prisma";

import { getYearInReviewStats } from "./get-stats";

export async function initializeEmailQueue() {
  const batchSize = 100; // Process teams in batches during initialization
  let skip = 0;
  let totalProcessed = 0;

  while (true) {
    // Get batch of teams
    const teams = await prisma.team.findMany({
      skip,
      take: batchSize,
      select: {
        id: true,
        name: true,
      },
    });

    if (teams.length === 0) break;

    // Process each team in the batch and filter out teams with no views
    const jobData = (
      await Promise.all(
        teams.map(async (team) => {
          const stats = await getYearInReviewStats(team.id);

          // Skip teams with no views
          if (stats.totalViews === 0) return null;

          return {
            teamId: team.id,
            status: "pending",
            stats: stats,
          };
        }),
      )
    ).filter((job): job is NonNullable<typeof job> => job !== null);

    // Bulk create jobs with precomputed stats
    await prisma.yearInReview.createMany({
      data: jobData,
      skipDuplicates: true,
    });

    totalProcessed += teams.length;
    skip += batchSize;

    console.log(`Processed ${totalProcessed} teams...`);
  }

  console.log(
    `Completed creating ${totalProcessed} email jobs with precomputed stats`,
  );
}
