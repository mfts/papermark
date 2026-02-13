import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

import AppMiddleware from "@/lib/middleware/app";
import DomainMiddleware from "@/lib/middleware/domain";

import { BLOCKED_PATHNAMES } from "./lib/constants";
import IncomingWebhookMiddleware, {
  isWebhookPath,
} from "./lib/middleware/incoming-webhooks";
import PostHogMiddleware from "./lib/middleware/posthog";

// Edge-compatible rate limiter for /view/ routes to prevent link ID enumeration
let _viewRateLimiter: Ratelimit | null = null;
function getViewRateLimiter(): Ratelimit | null {
  if (_viewRateLimiter) return _viewRateLimiter;
  try {
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return null;
    }
    _viewRateLimiter = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      // 60 unique view page requests per minute per IP
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "rl:view-page",
      analytics: true,
    });
    return _viewRateLimiter;
  } catch {
    return null;
  }
}

function isAnalyticsPath(path: string) {
  // Create a regular expression
  // ^ - asserts position at start of the line
  // /ingest/ - matches the literal string "/ingest/"
  // .* - matches any character (except for line terminators) 0 or more times
  const pattern = /^\/ingest\/.*/;

  return pattern.test(path);
}

function isCustomDomain(host: string) {
  return (
    (process.env.NODE_ENV === "development" &&
      (host?.includes(".local") || host?.includes("papermark.dev"))) ||
    (process.env.NODE_ENV !== "development" &&
      !(
        host?.includes("localhost") ||
        host?.includes("papermark.io") ||
        host?.includes("papermark.com") ||
        host?.endsWith(".vercel.app")
      ))
  );
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /sitemap.xml (static files)
     */
    "/((?!api/|_next/|_static|vendor|_icons|_vercel|favicon.ico|sitemap.xml).*)",
  ],
};

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  if (isAnalyticsPath(path)) {
    return PostHogMiddleware(req);
  }

  // Handle incoming webhooks
  if (isWebhookPath(host)) {
    return IncomingWebhookMiddleware(req);
  }

  // For custom domains, we need to handle them differently
  if (isCustomDomain(host || "")) {
    return DomainMiddleware(req);
  }

  // Handle standard papermark.com paths
  if (
    !path.startsWith("/view/") &&
    !path.startsWith("/verify") &&
    !path.startsWith("/unsubscribe") &&
    !path.startsWith("/auth/email")
  ) {
    return AppMiddleware(req);
  }

  // Check for blocked pathnames in view routes
  if (
    path.startsWith("/view/") &&
    (BLOCKED_PATHNAMES.some((blockedPath) => path.includes(blockedPath)) ||
      path.includes("."))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/404";
    return NextResponse.rewrite(url, { status: 404 });
  }

  // Rate limiting for /view/ routes to prevent link ID enumeration
  if (path.startsWith("/view/")) {
    const rateLimiter = getViewRateLimiter();
    if (rateLimiter) {
      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.ip ||
        "unknown";
      try {
        const result = await rateLimiter.limit(`view-page:${clientIp}`);
        if (!result.success) {
          return new NextResponse("Too Many Requests", {
            status: 429,
            headers: {
              "Retry-After": "60",
              "X-RateLimit-Remaining": "0",
            },
          });
        }
      } catch {
        // Fail open — don't block the request if rate limiting is unavailable
      }
    }
  }

  return NextResponse.next();
}
