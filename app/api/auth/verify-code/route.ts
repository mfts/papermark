import { NextRequest, NextResponse } from "next/server";

import {
  deleteMagicLinkData,
  getMagicLinkData,
  getMagicLinkDataByCode,
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

// GET: Verify via UUID (from email link)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const uuid = searchParams.get("uuid");

  if (!uuid) {
    return NextResponse.json({ error: "Missing UUID parameter" }, { status: 400 });
  }

  const ip = getClientIp(request);

  // Check IP rate limit
  const ipLimit = await ipRateLimit.limit(`verify_code:ip:${ip}`);
  if (!ipLimit.success) {
    return NextResponse.json(
      {
        error: "Too many attempts. Please wait before trying again.",
        retryAfter: Math.ceil((ipLimit.reset - Date.now()) / 1000),
      },
      { status: 429 },
    );
  }

  try {
    const magicLinkData = await getMagicLinkData(uuid);

    if (!magicLinkData) {
      return NextResponse.json(
        { error: "This code has expired or is invalid." },
        { status: 410 },
      );
    }

    const { callbackUrl, email, code } = magicLinkData;

    // Delete both Redis keys to prevent reuse
    await deleteMagicLinkData(uuid, email, code);

    return NextResponse.json({ callbackUrl });
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 },
    );
  }
}

// POST: Verify via email + code (manual entry)
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

    const magicLinkData = await getMagicLinkDataByCode(
      normalizedEmail,
      normalizedCode,
    );

    if (!magicLinkData) {
      return NextResponse.json(
        {
          error: "Invalid code. Please check your email and try again.",
          remaining: emailLimit.remaining,
        },
        { status: 401 },
      );
    }

    const { callbackUrl, uuid } = magicLinkData;

    // Delete both Redis keys to prevent reuse
    await deleteMagicLinkData(uuid, normalizedEmail, normalizedCode);

    return NextResponse.json({ callbackUrl });
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 },
    );
  }
}
