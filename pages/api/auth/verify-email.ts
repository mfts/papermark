import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { redis } from "@/lib/redis";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/ratelimit";

const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  code: z.string().length(6, "Verification code must be 6 digits"),
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
    const { email, code } = verifyEmailSchema.parse(req.body);

    // Rate limiting: 5 verification attempts per hour per email
    const { success } = await ratelimit(5, "1 h").limit(
      `email-verification:${email}`,
    );

    if (!success) {
      return res.status(429).json({
        error: "Too many verification attempts. Please try again later.",
      });
    }

    // Get verification code from Redis
    const storedCode = await redis.get(`email-verification:${email}`);

    if (!storedCode || storedCode !== code) {
      return res.status(400).json({
        error: "Invalid or expired verification code",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Mark email as verified
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    });

    // Remove verification code from Redis
    await redis.del(`email-verification:${email}`);

    return res.status(200).json({
      message: "Email verified successfully",
      verified: true,
    });

  } catch (error) {
    console.error("Email verification error:", error);

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