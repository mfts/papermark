import { NextApiRequest } from "next";

import crypto from "crypto";
import { z } from "zod";

import { redis } from "@/lib/redis";

import { getIpAddress } from "../utils/ip";

const COOKIE_EXPIRATION_TIME = 23 * 60 * 60 * 1000; // 23 hours

// Define the Zod schema for session data
export const DataroomSessionSchema = z.object({
  linkId: z.string(),
  dataroomId: z.string(),
  viewId: z.string(),
  viewerId: z.string().optional(),
  expiresAt: z.number(),
  ipAddress: z.string(),
});

// Generate TypeScript type from Zod schema
export type DataroomSession = z.infer<typeof DataroomSessionSchema>;

async function createDataroomSession(
  dataroomId: string,
  linkId: string,
  viewId: string,
  ipAddress: string,
  viewerId?: string,
): Promise<{ token: string; expiresAt: number }> {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + COOKIE_EXPIRATION_TIME;

  const sessionData: DataroomSession = {
    dataroomId,
    linkId,
    viewId,
    viewerId,
    expiresAt,
    ipAddress,
  };

  // Validate session data before storing
  DataroomSessionSchema.parse(sessionData);

  // Store session in Redis
  await redis.set(
    `dataroom_session:${sessionToken}`,
    JSON.stringify(sessionData),
    { pxat: expiresAt },
  );

  return {
    token: sessionToken,
    expiresAt,
  };
}

async function verifyDataroomSession(
  req: NextApiRequest,
  linkId: string,
  dataroomId: string,
): Promise<DataroomSession | null> {
  if (!dataroomId) return null;

  const sessionToken = req.cookies[`pm_drs_${linkId}`];
  if (!sessionToken) return null;

  const session = await redis.get(`dataroom_session:${sessionToken}`);
  if (!session) return null;

  try {
    const sessionData = DataroomSessionSchema.parse(session);

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      await redis.del(`dataroom_session:${sessionToken}`);
      return null;
    }

    const ipAddress = getIpAddress(req.headers);

    if (ipAddress !== sessionData.ipAddress) {
      await redis.del(`dataroom_session:${sessionToken}`);
      return null;
    }

    // Check if the session is for the correct link and dataroom
    if (
      sessionData.linkId !== linkId ||
      sessionData.dataroomId !== dataroomId
    ) {
      await redis.del(`dataroom_session:${sessionToken}`);
      return null;
    }

    return sessionData;
  } catch (error) {
    console.log("error", error);
    // If validation fails, delete invalid session and return null
    await redis.del(`dataroom_session:${sessionToken}`);
    return null;
  }
}

export { createDataroomSession, verifyDataroomSession };
