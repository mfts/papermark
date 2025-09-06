import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { nanoid } from "nanoid";

import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/ratelimit";
import { sendPasswordResetEmail } from "@/lib/emails/send-password-reset";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Rate limiting: 3 password reset requests per hour per email
    const { success } = await ratelimit(3, "1 h").limit(
      `password-reset:${email}`,
    );

    if (!success) {
      return res.status(429).json({
        error: "Too many password reset requests. Please try again later.",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.password) {
      // Still return success but don't send email
      return res.status(200).json({
        message: "If an account with this email exists, you will receive a password reset email.",
      });
    }

    // Delete any existing password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate reset token
    const resetToken = nanoid(32);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create password reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expires,
      },
    });

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail({
      email,
      resetUrl,
      name: user.name || "there",
    });

    return res.status(200).json({
      message: "If an account with this email exists, you will receive a password reset email.",
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors[0].message,
      });
    }

    return res.status(500).json({
      error: "Internal server error. Please try again.",
    });
  }
}