import { NextRequest, NextResponse } from "next/server";

import {
  deleteLoginCodeData,
  getLoginCodeData,
} from "@/lib/emails/send-verification-request";
import { ratelimit } from "@/lib/redis";

// Rate limiters
const emailRateLimit = ratelimit(5, "1 m"); // 5 attempts per minute per email
const ipRateLimit = ratelimit(10, "1 m"); // 10 attempts per minute per IP

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

// POST: Verify via email + code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim().toUpperCase();

    const ip = getClientIp(request);

    // Check both rate limits
    const [emailLimit, ipLimit] = await Promise.all([
      emailRateLimit.limit(`verify_code:${normalizedEmail}`),
      ipRateLimit.limit(`verify_code:ip:${ip}`),
    ]);

    if (!emailLimit.success) {
      return NextResponse.json(
        {
          error: "Too many attempts. Please wait before trying again.",
          retryAfter: Math.ceil((emailLimit.reset - Date.now()) / 1000),
          remaining: 0,
        },
        { status: 429 },
      );
    }

    if (!ipLimit.success) {
      return NextResponse.json(
        {
          error: "Too many attempts. Please wait before trying again.",
          retryAfter: Math.ceil((ipLimit.reset - Date.now()) / 1000),
          remaining: 0,
        },
        { status: 429 },
      );
    }

    const loginCodeData = await getLoginCodeData(
      normalizedEmail,
      normalizedCode,
    );

    if (!loginCodeData) {
      return NextResponse.json(
        {
          error: "Invalid code. Please check your email and try again.",
          remaining: emailLimit.remaining,
        },
        { status: 401 },
      );
    }

    const { callbackUrl } = loginCodeData;

    // Delete the Redis key to prevent reuse
    await deleteLoginCodeData(normalizedEmail, normalizedCode);

    return NextResponse.json({ callbackUrl });
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 },
    );
  }
}
