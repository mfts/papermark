import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PAPERMARK_HEADERS } from "../constants";

export default async function DomainMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  // clone the URL so we can modify it
  const url = req.nextUrl.clone();

  // if there's a path and it's not "/" then we need to check if it's a custom domain
  if (path !== "/") {
    // Subdomain available, rewriting
    console.log(`>>> Rewriting: ${path} to /view/domains/${host}${path}`);
    url.pathname = `/view/domains/${host}${path}`;
    return NextResponse.rewrite(url, PAPERMARK_HEADERS);
  } else {
    // redirect plain custom domain to papermark.io, eventually to it's own landing page
    return NextResponse.redirect(new URL("https://www.papermark.io", req.url));
  }
}
