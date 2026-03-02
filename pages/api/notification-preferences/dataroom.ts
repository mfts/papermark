import { NextApiRequest, NextApiResponse } from "next";

import { z } from "zod";

import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { verifyUnsubscribeToken } from "@/lib/utils/unsubscribe";
import { ZViewerNotificationPreferencesSchema } from "@/lib/zod/schemas/notifications";

const UpdatePreferencesSchema = z.object({
  frequency: z.enum(["instant", "daily", "weekly", "disabled"]),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const { token } = req.query as { token: string };

  if (!token) {
    res.status(400).json({ message: "Token is required" });
    return;
  }

  const payload = verifyUnsubscribeToken(token);

  if (!payload) {
    res.status(400).json({ message: "Invalid or expired token" });
    return;
  }

  if (payload.exp && payload.exp < Date.now() / 1000) {
    res.status(400).json({ message: "Token expired" });
    return;
  }

  const { viewerId, dataroomId, teamId } = payload;

  if (!dataroomId) {
    res.status(400).json({ message: "Dataroom ID is required" });
    return;
  }

  if (req.method === "GET") {
    return res.redirect(`/notification-preferences?token=${token}`);
  }

  // POST: update preferences
  const ipAddress =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const { success, limit, reset, remaining } = await ratelimit(5, "1 m").limit(
    `notification_prefs_${ipAddress}`,
  );

  res.setHeader("Retry-After", reset.toString());
  res.setHeader("X-RateLimit-Limit", limit.toString());
  res.setHeader("X-RateLimit-Remaining", remaining.toString());
  res.setHeader("X-RateLimit-Reset", reset.toString());

  if (!success) {
    return res.status(429).json({ error: "Too many requests" });
  }

  // RFC 8058 one-click unsubscribe: email clients POST with
  // body "List-Unsubscribe=One-Click" (form-urlencoded)
  const isOneClick =
    req.body?.["List-Unsubscribe"] === "One-Click" ||
    (typeof req.body === "string" &&
      req.body.includes("List-Unsubscribe=One-Click"));

  try {
    const frequency = isOneClick
      ? "disabled"
      : UpdatePreferencesSchema.parse(req.body).frequency;

    const viewer = await prisma.viewer.findUnique({
      where: { id: viewerId, teamId },
      select: { notificationPreferences: true },
    });

    if (!viewer) {
      return res.status(404).json({ message: "Viewer not found" });
    }

    const parsedPreferences = ZViewerNotificationPreferencesSchema.safeParse(
      viewer.notificationPreferences,
    );

    const rawPrefs =
      typeof viewer.notificationPreferences === "object" &&
      viewer.notificationPreferences !== null
        ? (viewer.notificationPreferences as Record<string, unknown>)
        : {};

    const base = {
      ...rawPrefs,
      ...(parsedPreferences.success ? parsedPreferences.data : {}),
    };

    const isDisabled = frequency === "disabled";
    const updatedPreferences = {
      ...base,
      dataroom: {
        ...(base.dataroom && typeof base.dataroom === "object"
          ? base.dataroom
          : {}),
        [dataroomId]: {
          enabled: !isDisabled,
          frequency: isDisabled ? "instant" : frequency,
        },
      },
    };

    await prisma.viewer.update({
      where: { id: viewerId, teamId },
      data: { notificationPreferences: updatedPreferences },
    });

    return res
      .status(200)
      .json({ message: "Notification preferences updated successfully." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request body", errors: error.errors });
    }
    console.error("Failed to update notification preferences:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
