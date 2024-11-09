import { NextRequest, NextResponse } from "next/server";

export default async function IncomingWebhookMiddleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Only handle /services/* paths
  if (path.startsWith("/services/")) {
    // Rewrite to /api/webhooks/services/*
    url.pathname = `/api/webhooks${path}`;

    return NextResponse.rewrite(url);
  }

  // Return 404 for all other paths
  url.pathname = "/404";
  return NextResponse.rewrite(url, { status: 404 });
}

export function isWebhookPath(host: string | null) {
  if (!process.env.NEXT_PUBLIC_WEBHOOK_BASE_HOST) {
    return false;
  }

  if (host === process.env.NEXT_PUBLIC_WEBHOOK_BASE_HOST) {
    return true;
  }

  return false;
}
