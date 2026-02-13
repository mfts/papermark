import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

import { BLOCKED_PATHNAMES } from "@/lib/constants";

// Edge-compatible rate limiter for custom domain page views.
// Prevents automated enumeration of link slugs on custom domains.
// Lazy-initialized to avoid errors when env vars are missing.
let _domainRateLimiter: Ratelimit | null = null;
function getDomainRateLimiter(): Ratelimit | null {
  if (_domainRateLimiter) return _domainRateLimiter;
  try {
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return null;
    }
    _domainRateLimiter = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      // 60 unique slug requests per minute per IP — generous for legitimate users,
      // but effectively blocks automated enumeration tools
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "rl:domain-page",
      analytics: true,
    });
    return _domainRateLimiter;
  } catch {
    return null;
  }
}

export default async function DomainMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  // If it's the root path, redirect to papermark.com
  if (path === "/") {
    if (host === "guide.permithealth.com") {
      return NextResponse.redirect(
        new URL("https://guide.permithealth.com/faq", req.url),
      );
    }

    if (host === "fund.tradeair.in") {
      return NextResponse.redirect(
        new URL("https://tradeair.in/sv-fm-inbound", req.url),
      );
    }

    if (host === "docs.pashupaticapital.com") {
      return NextResponse.redirect(
        new URL("https://www.pashupaticapital.com/", req.url),
      );
    }

    if (host === "partners.braxtech.net") {
      return NextResponse.redirect(
        new URL("https://partners.braxtech.net/investors", req.url),
      );
    }

    if (host === "research.elazaradvisors.com") {
      return NextResponse.redirect(
        new URL("https://research.elazaradvisors.com/root", req.url),
      );
    }

    return NextResponse.redirect(new URL("https://www.papermark.com", req.url));
  }

  const url = req.nextUrl.clone();

  // Check for blocked pathnames
  if (BLOCKED_PATHNAMES.includes(path) || path.includes(".")) {
    url.pathname = "/404";
    return NextResponse.rewrite(url, { status: 404 });
  }

  // --- Rate limiting to prevent link slug enumeration on custom domains ---
  const rateLimiter = getDomainRateLimiter();
  if (rateLimiter) {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";
    try {
      const result = await rateLimiter.limit(`domain-page:${clientIp}`);
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

  // Rewrite the URL to the correct page component for custom domains
  // Rewrite to the pages/view/domains/[domain]/[slug] route
  url.pathname = `/view/domains/${host}${path}`;

  return NextResponse.rewrite(url, {
    headers: {
      "X-Robots-Tag": "noindex",
      "X-Powered-By":
        "Papermark - Secure Data Room Infrastructure for the modern web",
    },
  });
}
