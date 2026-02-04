import { NextApiRequest } from "next";

import prisma from "@/lib/prisma";
import { getGeoData } from "@/lib/utils/geo";
import { getIpAddress } from "@/lib/utils/ip";
import { anonymizeIp, parseUserAgent } from "@/lib/utils/session";

/**
 * Creates or updates a UserSession record for session tracking.
 * This is called when user makes an authenticated request.
 */
export async function ensureUserSession(
  userId: string,
  sessionToken: string,
  req: NextApiRequest,
): Promise<void> {
  try {
    // Check if session already exists
    const existingSession = await prisma.userSession.findUnique({
      where: { sessionToken },
    });

    if (existingSession) {
      // Update lastActiveAt
      await prisma.userSession.update({
        where: { sessionToken },
        data: { lastActiveAt: new Date() },
      });
      return;
    }

    // Create new session record
    const userAgentString = req.headers["user-agent"] as string;
    const { browser, os, device } = parseUserAgent(userAgentString);
    const ip = getIpAddress(req.headers);
    const geo = getGeoData(req.headers);

    // Mark all other sessions as not current
    await prisma.userSession.updateMany({
      where: { userId },
      data: { isCurrent: false },
    });

    // Create the new session
    await prisma.userSession.create({
      data: {
        userId,
        sessionToken,
        userAgent: userAgentString,
        browser,
        os,
        device,
        ipAddress: anonymizeIp(ip),
        country: geo.country || null,
        city: geo.city || null,
        isCurrent: true,
      },
    });
  } catch (error) {
    // Log but don't throw - session tracking should not break the app
    console.error("Failed to ensure user session:", error);
  }
}

/**
 * Deletes all UserSession records for a user
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.userSession.deleteMany({
    where: { userId },
  });
}

/**
 * Deletes a specific UserSession
 */
export async function deleteUserSession(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const result = await prisma.userSession.deleteMany({
    where: {
      id: sessionId,
      userId, // Ensure user owns this session
    },
  });
  return result.count > 0;
}

/**
 * Gets all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  // Clean up old sessions (older than 30 days)
  await prisma.userSession.deleteMany({
    where: {
      userId,
      lastActiveAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Return active sessions sorted by last active
  return prisma.userSession.findMany({
    where: { userId },
    orderBy: { lastActiveAt: "desc" },
    select: {
      id: true,
      browser: true,
      os: true,
      device: true,
      ipAddress: true,
      country: true,
      city: true,
      isCurrent: true,
      lastActiveAt: true,
      createdAt: true,
    },
  });
}
