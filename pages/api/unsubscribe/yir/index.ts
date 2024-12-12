import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { verifyUnsubscribeToken } from "@/lib/utils/unsubscribe";
import { ZUserNotificationPreferencesSchema } from "@/lib/zod/schemas/notifications";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const { token } = req.query as { token: string };

  try {
    if (!token) {
      res.status(400).json({ message: "Token is required" });
      return;
    }

    if (req.method === "GET") {
      // For GET requests, redirect to the unsubscribe page
      return res.redirect(`/unsubscribe?type=yir&token=${token}`);
    }

    // Rate limit the unsubscribe request
    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const { success, limit, reset, remaining } = await ratelimit(
      5,
      "1 m",
    ).limit(`unsubscribe_${ipAddress}`);

    // Set rate limit headers
    res.setHeader("Retry-After", reset.toString());
    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", reset.toString());

    if (!success) {
      return res.status(429).json({ error: "Too many requests" });
    }

    const payload = verifyUnsubscribeToken(token);

    if (!payload) {
      res.status(404).json({ message: "Invalid token" });
      return;
    }

    if (payload.exp && payload.exp < new Date().getTime() / 1000) {
      res.status(404).json({ message: "Token expired" });
      return;
    }

    const { viewerId, teamId } = payload;

    // Fetch the current notification preferences
    const userTeam = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId: viewerId,
          teamId,
        },
      },
      select: { notificationPreferences: true },
    });

    if (!userTeam) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Parse existing preferences or initialize empty object
    let updatedPreferences;

    if (userTeam.notificationPreferences) {
      // Parse the existing preferences
      const defaultPreferences = ZUserNotificationPreferencesSchema.safeParse(
        userTeam.notificationPreferences,
      );

      // Update the preferences to opt out of year in review
      updatedPreferences = {
        ...defaultPreferences.data,
        yearInReview: { enabled: false },
      };
    } else {
      // If no preferences exist, initialize with year in review preference
      updatedPreferences = {
        yearInReview: { enabled: false },
      };
    }

    // Update the user's notification preferences in the database
    await prisma.userTeam.update({
      where: {
        userId_teamId: {
          userId: viewerId,
          teamId,
        },
      },
      data: {
        notificationPreferences: updatedPreferences,
      },
    });

    res.status(200).json({
      message: "Successfully unsubscribed from Year in Review emails.",
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
}
