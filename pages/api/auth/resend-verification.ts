import type { NextApiRequest, NextApiResponse } from "next";

import { checkRateLimit, rateLimiters } from "@/ee/features/security";

import {
  canResendVerificationEmail,
  createEmailVerificationToken,
  resendVerificationSchema,
} from "@/lib/auth/password-auth";
import { sendEmailVerificationEmail } from "@/lib/emails/send-email-verification";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";
import { getIpAddress } from "@/lib/utils/ip";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Rate limiting
    const clientIP = getIpAddress(req.headers);
    const rateLimitResult = await checkRateLimit(rateLimiters.auth, clientIP);

    if (!rateLimitResult.success) {
      log({
        message: `Rate limit exceeded for IP ${clientIP} during resend verification`,
        type: "error",
      });
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    // Validate input
    const validatedFields = resendVerificationSchema.safeParse(req.body);
    if (!validatedFields.success) {
      return res.status(400).json({
        error: validatedFields.error.errors[0]?.message || "Invalid input",
      });
    }

    const { email } = validatedFields.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true, passwordHash: true },
    });

    // Always return success to prevent user enumeration
    // Even if user doesn't exist or is already verified
    const successResponse = {
      success: true,
      message: "If an account exists with this email and is not verified, a verification email has been sent.",
    };

    // Check if user exists and has password auth but is not verified
    if (!user || !user.passwordHash || user.emailVerified) {
      return res.status(200).json(successResponse);
    }

    // Check rate limiting for this specific user
    const canResend = await canResendVerificationEmail(email);
    if (!canResend) {
      return res.status(200).json(successResponse); // Don't reveal rate limiting
    }

    // Create new verification token
    const verificationToken = await createEmailVerificationToken(user.id);

    // Send verification email
    await sendEmailVerificationEmail({
      email: user.email!,
      token: verificationToken,
    });

    log({
      message: `Verification email resent to: ${user.email}`,
      type: "info",
    });

    return res.status(200).json(successResponse);
  } catch (error) {
    console.error("Resend verification error:", error);
    log({
      message: `Resend verification error: ${error}`,
      type: "error",
    });
    return res.status(500).json({
      error: "An error occurred. Please try again.",
    });
  }
}
