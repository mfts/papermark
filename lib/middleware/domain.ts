import { NextRequest, NextResponse } from "next/server";
import { BLOCKED_PATHNAMES, PAPERMARK_HEADERS } from "@/lib/constants";

export default async function DomainMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  // clone the URL so we can modify it
  const url = req.nextUrl.clone();

  // if there's a path and it's not "/" then we need to check if it's a custom domain
  if (path !== "/") {
    if (BLOCKED_PATHNAMES.includes(path) || path.includes(".")) {
      url.pathname = "/404";
      return NextResponse.rewrite(url, { status: 404 });
    }
    // Subdomain available, rewriting
    // >>> Rewriting: ${path} to /view/domains/${host}${path}`
    url.pathname = `/view/domains/${host}${path}`;
    return NextResponse.rewrite(url, PAPERMARK_HEADERS);
  } else {
    // redirect plain custom domain to papermark.io, eventually to it's own landing page
    return NextResponse.redirect(new URL("https://www.papermark.io", req.url));
  }
}
