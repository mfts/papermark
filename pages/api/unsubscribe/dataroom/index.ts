import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { verifyUnsubscribeToken } from "@/lib/utils/unsubscribe";
import { ZViewerNotificationPreferencesSchema } from "@/lib/zod/schemas/notifications";

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
      return res.redirect(`/unsubscribe?type=dataroom&token=${token}`);
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

    const { viewerId, dataroomId, teamId } = payload;

    if (!dataroomId) {
      res.status(400).json({ message: "Dataroom ID is required" });
      return;
    }

    // Fetch the current notification preferences
    const viewer = await prisma.viewer.findUnique({
      where: { id: viewerId, teamId },
      select: { notificationPreferences: true },
    });

    if (!viewer) {
      res.status(404).json({ message: "Viewer not found" });
      return;
    }

    // Parse the existing preferences or initialize an empty object
    // Example preferences object:
    // {
    //   "dataroom": {
    //     "123": { enabled: true, frequency: "instant" },
    //     "456": { enabled: false, frequency: "daily" }
    //   },
    //   "document": {
    //     "789": { enabled: true, frequency: "weekly" }
    //   }
    // }
    let updatedPreferences;

    if (viewer.notificationPreferences) {
      // Parse the existing preferences
      const defaultPreferences = ZViewerNotificationPreferencesSchema.safeParse(
        viewer.notificationPreferences,
      );

      // Update the preferences for the specific dataroom
      updatedPreferences = {
        ...defaultPreferences.data,
        dataroom: {
          ...defaultPreferences.data?.dataroom,
          [dataroomId]: { enabled: false },
        },
      };
    } else {
      // If no preferences exist, initialize with the dataroom preference
      updatedPreferences = {
        dataroom: { [dataroomId]: { enabled: false } },
      };
    }

    // Update the viewer's notification preferences in the database
    await prisma.viewer.update({
      where: { id: viewerId, teamId },
      data: { notificationPreferences: updatedPreferences },
    });

    res
      .status(200)
      .json({ message: "Successfully unsubscribed from notifications." });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
}
