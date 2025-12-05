import { z } from "zod";

import prisma from "@/lib/prisma";

import {
  BUSINESS_PLAN_LIMITS,
  DATAROOMS_PLAN_LIMITS,
  DATAROOMS_PLUS_PLAN_LIMITS,
  DATAROOMS_PREMIUM_PLAN_LIMITS,
  DEFAULT_INVITATION_LIMITS,
  FREE_PLAN_LIMITS,
  PRO_PLAN_LIMITS,
  TInvitationLimits,
  TPlanLimits,
} from "./constants";

// Function to determine if a plan is free or free+drtrial
const isFreePlan = (plan: string) => plan === "free" || plan === "free+drtrial";
const isTrialPlan = (plan: string) => plan.includes("drtrial");

// Function to get the base plan from a plan string
const getBasePlan = (plan: string) => plan.split("+")[0];

const planLimitsMap: Record<string, TPlanLimits> = {
  free: FREE_PLAN_LIMITS,
  pro: PRO_PLAN_LIMITS,
  business: BUSINESS_PLAN_LIMITS,
  datarooms: DATAROOMS_PLAN_LIMITS,
  "datarooms-plus": DATAROOMS_PLUS_PLAN_LIMITS,
  "datarooms-premium": DATAROOMS_PREMIUM_PLAN_LIMITS,
};

/**
 * Schema for invitation limits that can be configured per team
 */
export const invitationLimitsSchema = z.object({
  maxEmailsPerRequest: z.number().min(1).max(100).optional(),
  maxInvitationsPerHour: z.number().min(1).max(1000).optional(),
  maxInvitationsPerDay: z.number().min(1).max(10000).optional(),
});

export const configSchema = z.object({
  datarooms: z.number().optional(),
  links: z
    .preprocess((v) => (v === null ? Infinity : Number(v)), z.number())
    .optional()
    .default(50),
  documents: z
    .preprocess((v) => (v === null ? Infinity : Number(v)), z.number())
    .optional()
    .default(50),
  users: z.number().optional(),
  domains: z.number().optional(),
  customDomainOnPro: z.boolean().optional(),
  customDomainInDataroom: z.boolean().optional(),
  advancedLinkControlsOnPro: z.boolean().nullish(),
  watermarkOnBusiness: z.boolean().nullish(),
  agreementOnBusiness: z.boolean().nullish(),
  conversationsInDataroom: z.boolean().nullish(),
  fileSizeLimits: z
    .object({
      video: z.number().optional(), // in MB
      document: z.number().optional(), // in MB
      image: z.number().optional(), // in MB
      excel: z.number().optional(), // in MB
      maxFiles: z.number().optional(), // in amount of files
      maxPages: z.number().optional(), // in amount of pages
    })
    .optional(),
  /**
   * Invitation rate limits for dataroom email invitations
   * - maxEmailsPerRequest: Max emails in a single API call (default: 30)
   * - maxInvitationsPerHour: Per-user hourly limit (default: 50)
   * - maxInvitationsPerDay: Per-team daily limit (default: 200)
   */
  invitations: invitationLimitsSchema.optional(),
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
          links: true,
          users: true,
          invitations: true,
        },
      },
    },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  const documentCount = team._count.documents;
  const linkCount = team._count.links;
  const userCount = team._count.users + team._count.invitations;

  // parse the limits json with zod and return the limits
  // {datarooms: 1, users: 1, domains: 1, customDomainOnPro: boolean, customDomainInDataroom: boolean}

  try {
    let parsedData = configSchema.parse(team.limits);

    const basePlan = getBasePlan(team.plan);
    const isTrial = isTrialPlan(team.plan);
    const defaultLimits = planLimitsMap[basePlan];

    // Adjust limits based on the plan if they're at the default value
    if (isFreePlan(team.plan)) {
      return {
        ...defaultLimits,
        ...parsedData,
        usage: { documents: documentCount, links: linkCount, users: userCount },
        ...(isTrial && {
          users: 3,
        }),
      };
    } else {
      return {
        ...defaultLimits,
        ...parsedData,
        // if account is paid, but link and document limits are not set, then set them to Infinity
        links: parsedData.links === 50 ? Infinity : parsedData.links,
        documents:
          parsedData.documents === 50 ? Infinity : parsedData.documents,
        usage: { documents: documentCount, links: linkCount, users: userCount },
      };
    }
  } catch (error) {
    // if no limits set or parsing fails, return default limits based on the plan
    const basePlan = getBasePlan(team.plan);
    const isTrial = isTrialPlan(team.plan);
    const defaultLimits = planLimitsMap[basePlan] || FREE_PLAN_LIMITS;
    return {
      ...defaultLimits,
      conversationsInDataroom: false,
      usage: { documents: documentCount, links: linkCount, users: userCount },
      ...(isTrial && {
        users: 3,
      }),
    };
  }
}

/**
 * Get invitation rate limits for a team
 * Returns team-specific limits if configured, otherwise returns defaults
 *
 * Note: These limits are enforced at the TEAM level (not per dataroom)
 * - maxEmailsPerRequest: Maximum emails per API call
 * - maxInvitationsPerHour: Per-user limit across all datarooms in the team
 * - maxInvitationsPerDay: Per-team limit across all datarooms
 */
export async function getInvitationLimits({
  teamId,
}: {
  teamId: string;
}): Promise<TInvitationLimits> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { limits: true },
    });

    if (!team?.limits) {
      return DEFAULT_INVITATION_LIMITS;
    }

    const parsed = configSchema.safeParse(team.limits);
    if (!parsed.success) {
      return DEFAULT_INVITATION_LIMITS;
    }

    // Merge team-specific overrides with defaults
    return {
      maxEmailsPerRequest:
        parsed.data.invitations?.maxEmailsPerRequest ??
        DEFAULT_INVITATION_LIMITS.maxEmailsPerRequest,
      maxInvitationsPerHour:
        parsed.data.invitations?.maxInvitationsPerHour ??
        DEFAULT_INVITATION_LIMITS.maxInvitationsPerHour,
      maxInvitationsPerDay:
        parsed.data.invitations?.maxInvitationsPerDay ??
        DEFAULT_INVITATION_LIMITS.maxInvitationsPerDay,
    };
  } catch (error) {
    console.error("Error fetching invitation limits:", error);
    return DEFAULT_INVITATION_LIMITS;
  }
}
