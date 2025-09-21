import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "@/lib/redis";

/**
 * Simple rate limiters for core endpoints
 */
export const rateLimiters = {
  // 3 auth attempts per hour per IP
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "20 m"),
    prefix: "rl:auth",
    analytics: true,
  }),

  // 5 billing operations per hour per IP
  billing: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "30 m"),
    prefix: "rl:billing",
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
