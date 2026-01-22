import { NextRequest, NextResponse } from "next/server";

import {
  deleteMagicLinkData,
  getMagicLinkData,
} from "@/lib/emails/send-verification-request";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=InvalidToken", request.url),
    );
  }

  try {
    // Get the magic link data from Redis (token is now a UUID)
    const magicLinkData = await getMagicLinkData(token);

    if (!magicLinkData) {
      // Token not found or expired - redirect back to verify page to show error
      return NextResponse.redirect(
        new URL(`/verify?token=${token}`, request.url),
      );
    }

    const { callbackUrl, email, code } = magicLinkData;

    // Delete the token from Redis to prevent reuse
    // Pass email and code for the new dual-key system
    await deleteMagicLinkData(token, email, code);

    // Redirect to the callback URL (NextAuth verification URL)
    return NextResponse.redirect(callbackUrl);
  } catch (error) {
    console.error("Error verifying magic link:", error);
    return NextResponse.redirect(
      new URL("/login?error=VerificationError", request.url),
    );
  }
}
