import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { ratelimit } from "@/lib/ratelimit";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
    const { token, password } = resetPasswordSchema.parse(req.body);

    // Rate limiting: 5 password reset attempts per hour per IP
    const { success } = await ratelimit(5, "1 h").limit(
      `reset-password:${req.headers["x-forwarded-for"] || req.connection.remoteAddress}`,
    );

    if (!success) {
      return res.status(429).json({
        error: "Too many password reset attempts. Please try again later.",
      });
    }

    // Find and validate reset token
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetTokenRecord) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    // Check if token is expired
    if (resetTokenRecord.expires < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetTokenRecord.id },
      });

      return res.status(400).json({
        error: "Reset token has expired. Please request a new password reset.",
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user password and ensure email is verified
    await prisma.user.update({
      where: { id: resetTokenRecord.userId },
      data: {
        password: hashedPassword,
        emailVerified: resetTokenRecord.user.emailVerified || new Date(), // Verify email if not already verified
      },
    });

    // Delete the used reset token
    await prisma.passwordResetToken.delete({
      where: { id: resetTokenRecord.id },
    });

    return res.status(200).json({
      message: "Password reset successfully",
    });

  } catch (error) {
    console.error("Reset password error:", error);

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