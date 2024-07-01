import { z } from "zod";

import prisma from "@/lib/prisma";

export async function getLimits({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string;
}) {
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
      users: {
        some: {
          userId: userId,
        },
      },
    },
    select: {
      plan: true,
      limits: true,
    },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  // parse the limits json with zod and return the limits
  // {datarooms: 1, users: 1, domains: 1, customDomainOnPro: boolean, customDomainInDataroom: boolean}

  const configSchema = z.object({
    datarooms: z.number(),
    users: z.number(),
    domains: z.number(),
    customDomainOnPro: z.boolean(),
    customDomainInDataroom: z.boolean(),
    advancedLinkControlsOnPro: z.boolean().nullish(),
  });

  try {
    const parsedData = configSchema.parse(team.limits);

    return parsedData;
  } catch (error) {
    // if no limits set, then return null and don't block the team
    return null;
  }
}
