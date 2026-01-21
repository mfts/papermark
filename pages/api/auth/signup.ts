import type { NextApiRequest, NextApiResponse } from "next";

import { checkRateLimit, rateLimiters } from "@/ee/features/security";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
import {
  createEmailVerificationToken,
  createUserWithPassword,
  signupSchema,
} from "@/lib/auth/password-auth";
import { isBlacklistedEmail } from "@/lib/edge-config/blacklist";
import { sendEmailVerificationEmail } from "@/lib/emails/send-email-verification";
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
        message: `Rate limit exceeded for IP ${clientIP} during signup attempt`,
        type: "error",
      });
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    // Validate input
    const validatedFields = signupSchema.safeParse(req.body);
    if (!validatedFields.success) {
      return res.status(400).json({
        error: validatedFields.error.errors[0]?.message || "Invalid input",
      });
    }

    const { email, password, name } = validatedFields.data;

    // Check if email is blacklisted
    if (await isBlacklistedEmail(email)) {
      await trackAnalytics({
        event: "User Sign Up Blocked",
        email,
      });
      // Return generic error to avoid user enumeration
      return res.status(400).json({
        error: "Unable to create account. Please try again.",
      });
    }

    // Create user
    const result = await createUserWithPassword({ email, password, name });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const user = result.user!;

    // Create verification token and send email
    const verificationToken = await createEmailVerificationToken(user.id);

    // Send verification email
    await sendEmailVerificationEmail({
      email: user.email!,
      token: verificationToken,
    });

    // Track signup
    await identifyUser(user.email ?? user.id);
    await trackAnalytics({
      event: "User Signed Up",
      email: user.email,
      userId: user.id,
      method: "password",
    });

    log({
      message: `New user signed up with email+password: ${user.email}`,
      type: "info",
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    log({
      message: `Signup error: ${error}`,
      type: "error",
    });
    return res.status(500).json({
      error: "An error occurred. Please try again.",
    });
  }
}
