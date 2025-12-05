import { Ratelimit } from "@upstash/ratelimit";

import {
  DEFAULT_INVITATION_LIMITS,
  TInvitationLimits,
} from "@/ee/limits/constants";
import { redis } from "@/lib/redis";

/**
 * Re-export invitation limits from central location for backward compatibility
 * @deprecated Use getInvitationLimits() from @/ee/limits/server for team-specific limits
 */
export const INVITATION_LIMITS = DEFAULT_INVITATION_LIMITS;

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
};

/**
 * Create a rate limiter for invitation emails with custom limits
 * This allows per-team configuration of rate limits
 */
export function createInvitationRateLimiter(
  type: "user" | "team",
  limits: TInvitationLimits,
): Ratelimit {
  if (type === "user") {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limits.maxInvitationsPerHour, "1 h"),
      prefix: "rl:invitation:user",
      enableProtection: true,
      analytics: true,
    });
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limits.maxInvitationsPerDay, "24 h"),
    prefix: "rl:invitation:team",
    enableProtection: true,
    analytics: true,
  });
}

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
