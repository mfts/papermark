import { NextRequest, NextResponse } from "next/server";

import { BLOCKED_PATHNAMES } from "@/lib/constants";
import { getDomainRedirectUrl } from "@/lib/api/domains/redis";

export default async function DomainMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  // If it's the root path, check for a configured redirect URL in Redis
  if (path === "/") {
    if (host) {
      const redirectUrl = await getDomainRedirectUrl(host);
      if (redirectUrl) {
        return NextResponse.redirect(new URL(redirectUrl, req.url), {
          status: 301,
        });
      }
    }

    return NextResponse.redirect(new URL("https://www.papermark.com", req.url));
  }

  const url = req.nextUrl.clone();

  // Check for blocked pathnames
  if (BLOCKED_PATHNAMES.includes(path) || path.includes(".")) {
    url.pathname = "/404";
    return NextResponse.rewrite(url, { status: 404 });
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
