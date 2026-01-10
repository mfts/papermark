import { NextRequest, NextResponse } from "next/server";
import { ipAddress, waitUntil } from "@vercel/functions";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { sendOtpVerificationEmail } from "@/lib/emails/send-email-otp-verification";
import { generateOTP } from "@/lib/utils/generate-otp";
import { validateEmail } from "@/lib/utils/validate-email";
import { VerifyEmailRequestSchema } from "@/ee/features/workflows/lib/types";

// POST /app/(ee)/api/workflow-entry/[entryLinkId]/verify - Send OTP
export async function POST(
  req: NextRequest,
  { params }: { params: { entryLinkId: string } },
) {
  try {
    const { entryLinkId } = params;
    const body = await req.json();

    // Validate entryLinkId format
    const linkIdValidation = z.string().cuid().safeParse(entryLinkId);
    if (!linkIdValidation.success) {
      return NextResponse.json(
        { error: "Invalid link ID format" },
        { status: 400 },
      );
    }

    // Validate request body
    const validation = VerifyEmailRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    const { email } = validation.data;

    // Find workflow by entry link
    const workflow = await prisma.workflow.findUnique({
      where: { entryLinkId },
      select: {
        id: true,
        isActive: true,
        name: true,
        teamId: true,
        entryLink: {
          select: {
            id: true,
            isArchived: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow entry link not found" },
        { status: 404 },
      );
    }

    if (!workflow.isActive) {
      return NextResponse.json(
        { error: "This workflow is currently inactive" },
        { status: 403 },
      );
    }

    if (workflow.entryLink.isArchived || workflow.entryLink.deletedAt) {
      return NextResponse.json(
        { error: "This link is no longer available" },
        { status: 404 },
      );
    }

    // Rate limit per email/entryLink combination (1 per 30 seconds) to prevent OTP flooding
    const { success: emailLimitSuccess } = await ratelimit(1, "30 s").limit(
      `workflow-otp:${entryLinkId}:${email}`,
    );
    if (!emailLimitSuccess) {
      return NextResponse.json(
        {
          error:
            "Please wait before requesting another code. Try again in 30 seconds.",
        },
        { status: 429 },
      );
    }

    // Additional IP-based rate limit (10 per minute) to prevent abuse across different emails
    const ipAddressValue = ipAddress(req);
    const { success } = await ratelimit(10, "1 m").limit(
      `workflow-otp:${ipAddressValue}`,
    );
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // Delete any existing OTP codes for this workflow entry + email
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `workflow-otp:${entryLinkId}:${email}`,
      },
    });

    // Generate and store OTP
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // expires in 10 minutes

    await prisma.verificationToken.create({
      data: {
        token: otpCode,
        identifier: `workflow-otp:${entryLinkId}:${email}`,
        expires: expiresAt,
      },
    });

    // Send OTP email
    waitUntil(
      sendOtpVerificationEmail(email, otpCode, false, workflow.teamId),
    );

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Error sending workflow verification code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

