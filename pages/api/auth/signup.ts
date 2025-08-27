import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { nanoid } from "nanoid";

import { hashPassword } from "@/lib/utils";
import { ratelimit } from "@/lib/ratelimit";
import { sendOtpVerificationEmail } from "@/lib/emails/send-email-otp-verification";
import { redis } from "@/lib/redis";
import prisma from "@/lib/prisma";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  email: z.string().email("Invalid email address").toLowerCase(),
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
    const { name, email, password } = signupSchema.parse(req.body);

    // Rate limiting: 3 signup attempts per hour per IP
    const { success } = await ratelimit(3, "1 h").limit(
      `signup:${req.headers["x-forwarded-for"] || req.connection.remoteAddress}`,
    );

    if (!success) {
      return res.status(429).json({
        error: "Too many signup attempts. Please try again later.",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return res.status(400).json({
          error: "User with this email already exists",
        });
      } else {
        // User exists but email not verified, update their data and resend verification
        const hashedPassword = await hashPassword(password);
        await prisma.user.update({
          where: { email },
          data: {
            name,
            password: hashedPassword,
          },
        });

        // Generate new verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store verification code in Redis (expires in 15 minutes)
        await redis.set(
          `email-verification:${email}`,
          verificationCode,
          { ex: 15 * 60 }
        );

        // Send verification email
        await sendOtpVerificationEmail(email, verificationCode, false, "");

        return res.status(200).json({
          message: "Verification email sent. Please check your inbox.",
          requiresVerification: true,
        });
      }
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: null, // Will be set when email is verified
      },
    });

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code in Redis (expires in 15 minutes)
    await redis.set(
      `email-verification:${email}`,
      verificationCode,
      { ex: 15 * 60 }
    );

    // Send verification email
    await sendOtpVerificationEmail(email, verificationCode, false, "");

    return res.status(201).json({
      message: "Account created successfully. Please check your email for verification code.",
      requiresVerification: true,
      userId: user.id,
    });

  } catch (error) {
    console.error("Signup error:", error);

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