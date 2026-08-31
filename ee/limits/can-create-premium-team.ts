import prisma from "@/lib/prisma";

import type { PrismaClient } from "@prisma/client";

export const PREMIUM_TEAM_LIMIT = 5;

const PREMIUM_PLANS = ["datarooms-premium"];

type PrismaTx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function getPremiumTeamEligibility(
  userId: string,
  tx: PrismaClient | PrismaTx = prisma as any,
): Promise<{
  isPremiumAdmin: boolean;
  canCreate: boolean;
}> {
  const adminTeams = await tx.userTeam.findMany({
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

  const isPremiumAdmin = adminTeams.some((member: any) =>
    PREMIUM_PLANS.includes(member.team.plan)
  );

  return {
    isPremiumAdmin,
    canCreate: isPremiumAdmin && adminTeams.length < PREMIUM_TEAM_LIMIT,
  };
}