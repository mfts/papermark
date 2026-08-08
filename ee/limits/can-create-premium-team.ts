import prisma from "@/lib/prisma";

export const PREMIUM_TEAM_LIMIT = 5;

const PREMIUM_PLANS = ["datarooms-premium"];

export async function getPremiumTeamEligibility(userId: string): Promise<{
  isPremiumAdmin: boolean;
  canCreate: boolean;
}> {
  const adminTeams = await prisma.userTeam.findMany({
    where: {
      userId,
      role: "ADMIN",
    },
    select: {
      teamId: true,
      team: {
        select: {
          plan: true,
        },
      },
    },
  });

  const isPremiumAdmin = adminTeams.some((member) =>
    PREMIUM_PLANS.some((plan) => member.team.plan.includes(plan)),
  );

  return {
    isPremiumAdmin,
    canCreate: isPremiumAdmin && adminTeams.length < PREMIUM_TEAM_LIMIT,
  };
}