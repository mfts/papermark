import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";

import { getRedisKey } from "./redis";

/**
 * Clears all redirect URLs for every domain belonging to a team,
 * removing them from both Postgres and Redis.
 */
export async function clearTeamDomainRedirects(
  teamId: string,
): Promise<void> {
  const domains = await prisma.domain.findMany({
    where: { teamId, redirectUrl: { not: null } },
    select: { slug: true },
  });

  if (domains.length === 0) return;

  await Promise.all([
    prisma.domain.updateMany({
      where: { teamId, redirectUrl: { not: null } },
      data: { redirectUrl: null },
    }),
    ...domains.map((d) => redis.del(getRedisKey(d.slug))),
  ]);
}
