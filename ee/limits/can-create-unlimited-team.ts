import prisma from "@/lib/prisma";

import type { PrismaClient } from "@prisma/client";

const UNLIMITED_PLANS = ["datarooms-unlimited"];

type PrismaTx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function canCreateUnlimitedTeam(
  userId: string,
  tx: PrismaClient | PrismaTx = prisma as any
): Promise<boolean> {
  const teams = await tx.userTeam.findMany({
    where: {
      userId,
      role: "ADMIN",
      team: {
        plan: {
          in: UNLIMITED_PLANS,
        },
      },
    },
    select: {
      teamId: true,
    },
    take: 1,
  });

  return teams.length > 0;
}