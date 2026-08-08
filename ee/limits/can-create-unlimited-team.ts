import prisma from "@/lib/prisma";

const UNLIMITED_PLANS = ["datarooms-unlimited"];

export async function canCreateUnlimitedTeam(userId: string): Promise<boolean> {
  const teams = await prisma.userTeam.findMany({
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