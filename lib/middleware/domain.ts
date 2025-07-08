import { NextRequest, NextResponse } from "next/server";

import { BLOCKED_PATHNAMES } from "@/lib/constants";

export default async function DomainMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  // If it's the root path, redirect to papermark.com/home
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

    return NextResponse.redirect(
      new URL("https://www.papermark.com/home", req.url),
    );
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
        "Papermark.io - Document sharing infrastructure for the modern web",
    },
  });
}
