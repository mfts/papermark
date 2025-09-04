import { NextRequest, NextResponse } from "next/server";

export default async function PostHogMiddleware(req: NextRequest) {
  let url = req.nextUrl.clone();
  const hostname = url.pathname.startsWith("/ingest/static/")
    ? "eu-assets.i.posthog.com"
    : "eu.i.posthog.com";

  // Handle OPTIONS method for CORS preflight
  if (req.method === "OPTIONS") {
    return new NextResponse("", {
      status: 200,
    });
  }

  // Create clean headers object with only necessary headers
  const forwardHeaders = new Headers();

  // Headers that PostHog needs
  const allowedHeaders = [
    "accept",
    "accept-encoding",
    "accept-language",
    "authorization",
    "content-type",
    "content-length",
    "user-agent",
    "referer",
    "origin",
    "forwarded",
    "x-forwarded-for",
    "x-forwarded-host",
    "x-forwarded-proto",
    "x-real-ip",
    // PostHog specific headers
    "x-posthog-*",
  ];

  // Copy allowed headers from the original request
  for (const [key, value] of req.headers.entries()) {
    const lowerKey = key.toLowerCase();

    // Check if header is allowed
    if (
      allowedHeaders.some((allowed) =>
        allowed.endsWith("*")
          ? lowerKey.startsWith(allowed.slice(0, -1))
          : lowerKey === allowed,
      )
    ) {
      forwardHeaders.set(key, value);
    }
  }

  // Set the correct host for PostHog
  forwardHeaders.set("host", hostname);

  url.protocol = "https";
  url.hostname = hostname;
  url.port = "443";
  url.pathname = url.pathname.replace(/^\/ingest/, "");

  return NextResponse.rewrite(url, {
    request: {
      headers: forwardHeaders,
    },
  });
}
