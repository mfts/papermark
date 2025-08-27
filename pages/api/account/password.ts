import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { hashPassword, checkPassword } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/ratelimit";
import { CustomUser } from "@/lib/types";

const setPasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sessionUser = session.user as CustomUser;

  // Rate limiting: 5 password operations per hour per user
  const { success } = await ratelimit(5, "1 h").limit(
    `password-change:${sessionUser.id}`,
  );

  if (!success) {
    return res.status(429).json({
      error: "Too many password change attempts. Please try again later.",
    });
  }

  if (req.method === "POST") {
    // Set password for users who don't have one (e.g., users who signed up with OAuth)
    try {
      const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.password) {
        // User already has a password, they need to use the PUT method to change it
        return res.status(400).json({
          error: "User already has a password. Use password change instead.",
        });
      }

      const { newPassword } = setPasswordSchema.parse(req.body);
      const hashedPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: sessionUser.id },
        data: { password: hashedPassword },
      });

      return res.status(200).json({ message: "Password set successfully" });
    } catch (error) {
      console.error("Set password error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.errors[0].message,
        });
      }

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  if (req.method === "PUT") {
    // Change existing password
    try {
      const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.password) {
        return res.status(400).json({
          error: "User doesn't have a password set. Use password setting instead.",
        });
      }

      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

      // Verify current password
      const isValidPassword = await checkPassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: sessionUser.id },
        data: { password: hashedPassword },
      });

      return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.errors[0].message,
        });
      }

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  if (req.method === "GET") {
    // Check if user has a password set
    try {
      const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { password: true },
      });

      return res.status(200).json({
        hasPassword: !!user?.password,
      });
    } catch (error) {
      console.error("Check password status error:", error);
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return res.status(405).json({ error: "Method not allowed" });
}