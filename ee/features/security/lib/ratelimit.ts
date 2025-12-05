import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "@/lib/redis";

/**
 * Invitation rate limiting constants
 */
export const INVITATION_LIMITS = {
  // Maximum emails that can be sent in a single request
  MAX_EMAILS_PER_REQUEST: 30,
  // Maximum invitations per hour per user
  MAX_INVITATIONS_PER_HOUR: 50,
  // Maximum invitations per day per team
  MAX_INVITATIONS_PER_DAY: 200,
} as const;

/**
 * Simple rate limiters for core endpoints
 */
export const rateLimiters = {
  // 3 auth attempts per hour per IP
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "20 m"),
    prefix: "rl:auth",
    enableProtection: true,
    analytics: true,
  }),

  // 5 billing operations per hour per IP
  billing: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "20 m"),
    prefix: "rl:billing",
    enableProtection: true,
    analytics: true,
  }),

  // Rate limiter for invitation emails per user (50 per hour)
  invitationUser: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      INVITATION_LIMITS.MAX_INVITATIONS_PER_HOUR,
      "1 h",
    ),
    prefix: "rl:invitation:user",
    enableProtection: true,
    analytics: true,
  }),

  // Rate limiter for invitation emails per team (200 per day)
  invitationTeam: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      INVITATION_LIMITS.MAX_INVITATIONS_PER_DAY,
      "24 h",
    ),
    prefix: "rl:invitation:team",
    enableProtection: true,
    analytics: true,
  }),
};

/**
 * Apply rate limiting with error handling
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Fail open - allow request if rate limiting fails
    return { success: true, error: "Rate limiting unavailable" };
  }
}
