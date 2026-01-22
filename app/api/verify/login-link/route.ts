import { NextRequest, NextResponse } from "next/server";

// Legacy magic link route - redirect to new code-based flow
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/auth/email", request.url));
}
