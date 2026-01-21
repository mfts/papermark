import type { NextApiRequest, NextApiResponse } from "next";

import { checkRateLimit, rateLimiters } from "@/ee/features/security";

import {
  createPasswordResetToken,
  forgotPasswordSchema,
} from "@/lib/auth/password-auth";
import { sendPasswordResetEmail } from "@/lib/emails/send-password-reset";
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
        message: `Rate limit exceeded for IP ${clientIP} during forgot password`,
        type: "error",
      });
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    // Validate input
    const validatedFields = forgotPasswordSchema.safeParse(req.body);
    if (!validatedFields.success) {
      return res.status(400).json({
        error: validatedFields.error.errors[0]?.message || "Invalid input",
      });
    }

    const { email } = validatedFields.data;

    // Create password reset token
    // This function always returns success to prevent user enumeration
    const result = await createPasswordResetToken(email);

    // Only send email if token was created (user exists with password)
    if (result.token) {
      await sendPasswordResetEmail({
        email,
        token: result.token,
      });

      log({
        message: `Password reset email sent to: ${email}`,
        type: "info",
      });
    }

    // Always return the same response to prevent user enumeration
    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    log({
      message: `Forgot password error: ${error}`,
      type: "error",
    });
    return res.status(500).json({
      error: "An error occurred. Please try again.",
    });
  }
}
