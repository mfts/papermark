import type { NextApiRequest, NextApiResponse } from "next";

import { verifyEmailToken } from "@/lib/auth/password-auth";
import { log } from "@/lib/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Invalid token" });
    }

    const result = await verifyEmailToken(token);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    log({
      message: `Email verified for user: ${result.user?.email}`,
      type: "info",
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    log({
      message: `Email verification error: ${error}`,
      type: "error",
    });
    return res.status(500).json({
      error: "An error occurred. Please try again.",
    });
  }
}
