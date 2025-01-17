import { z } from "zod";

import prisma from "@/lib/prisma";

import {
  BUSINESS_PLAN_LIMITS,
  DATAROOMS_PLAN_LIMITS,
  FREE_PLAN_LIMITS,
  PRO_PLAN_LIMITS,
  TPlanLimits,
} from "./constants";

// Function to determine if a plan is free or free+drtrial
const isFreePlan = (plan: string) => plan === "free" || plan === "free+drtrial";

// Function to get the base plan from a plan string
const getBasePlan = (plan: string) => plan.split("+")[0];

const planLimitsMap: Record<string, TPlanLimits> = {
  free: FREE_PLAN_LIMITS,
  pro: PRO_PLAN_LIMITS,
  business: BUSINESS_PLAN_LIMITS,
  datarooms: DATAROOMS_PLAN_LIMITS,
};

const configSchema = z.object({
  datarooms: z.number(),
  links: z
    .preprocess((v) => (v === null ? Infinity : Number(v)), z.number())
    .optional()
    .default(10),
  documents: z
    .preprocess((v) => (v === null ? Infinity : Number(v)), z.number())
    .optional()
    .default(10),
  users: z.number(),
  domains: z.number(),
  customDomainOnPro: z.boolean(),
  customDomainInDataroom: z.boolean(),
  advancedLinkControlsOnPro: z.boolean().nullish(),
  watermarkOnBusiness: z.boolean().nullish(),
});

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
      _count: {
        select: {
          documents: true,
        },
      },
      documents: {
        select: {
          _count: {
            select: {
              links: true,
            },
          },
        },
      },
    },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  const documentCount = team._count.documents;
  const linkCount = team.documents.reduce(
    (sum, doc) => sum + doc._count.links,
    0,
  );

  // parse the limits json with zod and return the limits
  // {datarooms: 1, users: 1, domains: 1, customDomainOnPro: boolean, customDomainInDataroom: boolean}

  try {
    let parsedData = configSchema.parse(team.limits);

    // Adjust limits based on the plan if they're at the default value
    if (isFreePlan(team.plan)) {
      return {
        ...parsedData,
        usage: { documents: documentCount, links: linkCount },
      };
    } else {
      return {
        ...parsedData,
        // if account is paid, but link and document limits are not set, then set them to Infinity
        links: parsedData.links === 10 ? Infinity : parsedData.links,
        documents:
          parsedData.documents === 10 ? Infinity : parsedData.documents,
        usage: { documents: documentCount, links: linkCount },
      };
    }
  } catch (error) {
    // if no limits set or parsing fails, return default limits based on the plan
    const basePlan = getBasePlan(team.plan);
    const defaultLimits = planLimitsMap[basePlan] || FREE_PLAN_LIMITS;

    return {
      ...defaultLimits,
      usage: { documents: documentCount, links: linkCount },
    };
  }
}
