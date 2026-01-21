import type { NextApiRequest, NextApiResponse } from "next";

import { checkRateLimit, rateLimiters } from "@/ee/features/security";

import {
  resetPassword,
  resetPasswordSchema,
  verifyPasswordResetToken,
} from "@/lib/auth/password-auth";
import { log } from "@/lib/utils";
import { getIpAddress } from "@/lib/utils/ip";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Handle GET request to verify token validity
  if (req.method === "GET") {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Invalid token" });
      }

      const result = await verifyPasswordResetToken(token);

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json({
        valid: true,
        message: "Token is valid",
      });
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(500).json({
        error: "An error occurred. Please try again.",
      });
    }
  }

  // Handle POST request to reset password
  if (req.method === "POST") {
    try {
      // Rate limiting
      const clientIP = getIpAddress(req.headers);
      const rateLimitResult = await checkRateLimit(rateLimiters.auth, clientIP);

      if (!rateLimitResult.success) {
        log({
          message: `Rate limit exceeded for IP ${clientIP} during password reset`,
          type: "error",
        });
        return res.status(429).json({
          error: "Too many requests. Please try again later.",
        });
      }

      // Validate input
      const validatedFields = resetPasswordSchema.safeParse(req.body);
      if (!validatedFields.success) {
        return res.status(400).json({
          error: validatedFields.error.errors[0]?.message || "Invalid input",
        });
      }

      const { token, password } = validatedFields.data;

      // Reset password
      const result = await resetPassword(token, password);

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      log({
        message: "Password reset successfully",
        type: "info",
      });

      return res.status(200).json({
        success: true,
        message: "Password reset successfully. You can now sign in with your new password.",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      log({
        message: `Password reset error: ${error}`,
        type: "error",
      });
      return res.status(500).json({
        error: "An error occurred. Please try again.",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
