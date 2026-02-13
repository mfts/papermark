import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "@/lib/redis";

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

  // Link enumeration prevention: 30 unique link lookups per minute per IP
  // This limits how fast someone can probe for valid links
  linkLookup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "rl:link-lookup",
    enableProtection: true,
    analytics: true,
  }),

  // Stricter rate limit for failed link lookups: 10 misses per minute per IP
  // Penalizes repeated misses more aggressively to slow down enumeration
  linkLookupMiss: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "rl:link-lookup-miss",
    enableProtection: true,
    analytics: true,
  }),

  // View creation rate limit: 20 per minute per IP
  // Prevents rapid-fire view creation attempts to probe for valid links
  viewCreation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "rl:view-creation",
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
