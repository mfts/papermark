import { NextApiRequest } from "next";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { ipAddress } from "@vercel/functions";
import { parse } from "cookie";
import crypto from "crypto";
import { z } from "zod";

import { redis } from "@/lib/redis";

import { LOCALHOST_IP } from "../utils/geo";
import { getIpAddress } from "../utils/ip";

const COOKIE_EXPIRATION_TIME = 23 * 60 * 60 * 1000; // 23 hours
const DATAROOM_SESSION_COOKIE_PREFIX = "pm_drs_";
const DATAROOM_SESSION_BINDING_COOKIE_PREFIX = "pm_drs_bind_";

/**
 * Normalize IP addresses so that IPv6 loopback (::1),
 * IPv4-mapped IPv6 (::ffff:127.0.0.1) and plain 127.0.0.1
 * all compare equal.
 */
function normalizeIp(ip: string): string {
  const trimmed = ip.trim();
  // Treat all localhost variants as 127.0.0.1
  if (trimmed === "::1" || trimmed === "::ffff:127.0.0.1") {
    return LOCALHOST_IP;
  }
  // Strip ::ffff: prefix from IPv4-mapped IPv6 addresses
  if (trimmed.startsWith("::ffff:")) {
    return trimmed.slice(7);
  }
  return trimmed;
}

function getDataroomSessionCookieName(linkId: string): string {
  return `${DATAROOM_SESSION_COOKIE_PREFIX}${linkId}`;
}

function getDataroomSessionBindingCookieName(linkId: string): string {
  return `${DATAROOM_SESSION_BINDING_COOKIE_PREFIX}${linkId}`;
}

function hashBindingToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function verifyBindingTokenHash(
  expectedHash: string,
  presentedToken: string,
): boolean {
  const expected = Buffer.from(expectedHash, "hex");
  const presented = Buffer.from(hashBindingToken(presentedToken), "hex");
  if (expected.length !== presented.length) return false;
  return crypto.timingSafeEqual(expected, presented);
}

function parseDataroomSession(raw: unknown): DataroomSession {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return DataroomSessionSchema.parse(parsed);
}

// Define the Zod schema for session data
export const DataroomSessionSchema = z.object({
  linkId: z.string(),
  dataroomId: z.string(),
  viewId: z.string(),
  viewerId: z.string().optional(),
  expiresAt: z.number(),
  ipAddress: z.string(),
  clientBindingHash: z.string().optional(),
  verified: z.boolean(),
});

// Generate TypeScript type from Zod schema
export type DataroomSession = z.infer<typeof DataroomSessionSchema>;

async function createDataroomSession(
  dataroomId: string,
  linkId: string,
  viewId: string,
  ipAddress: string,
  verified: boolean,
  viewerId?: string,
): Promise<{ token: string; bindingToken: string; expiresAt: number }> {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const bindingToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + COOKIE_EXPIRATION_TIME;

  const sessionData: DataroomSession = {
    dataroomId,
    linkId,
    viewId,
    viewerId,
    expiresAt,
    ipAddress: normalizeIp(ipAddress),
    clientBindingHash: hashBindingToken(bindingToken),
    verified,
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
    bindingToken,
    expiresAt,
  };
}

async function verifyDataroomSession(
  request: NextRequest,
  linkId: string,
  dataroomId: string,
): Promise<DataroomSession | null> {
  if (!dataroomId) return null;

  const sessionToken = cookies().get(getDataroomSessionCookieName(linkId))?.value;
  const bindingToken = cookies().get(
    getDataroomSessionBindingCookieName(linkId),
  )?.value;
  if (!sessionToken) return null;

  const session = await redis.get(`dataroom_session:${sessionToken}`);
  if (!session) return null;

  try {
    const sessionData = parseDataroomSession(session);

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      await redis.del(`dataroom_session:${sessionToken}`);
      return null;
    }

    if (
      sessionData.clientBindingHash &&
      (!bindingToken ||
        !verifyBindingTokenHash(sessionData.clientBindingHash, bindingToken))
    ) {
      await redis.del(`dataroom_session:${sessionToken}`);
      return null;
    }

    // Keep IP for telemetry/watermark context only; do not invalidate session on IP rotation.
    const ipAddressValue = normalizeIp(ipAddress(request) ?? LOCALHOST_IP);
    if (ipAddressValue !== sessionData.ipAddress) {
      await redis.set(
        `dataroom_session:${sessionToken}`,
        JSON.stringify({ ...sessionData, ipAddress: ipAddressValue }),
        { pxat: sessionData.expiresAt },
      );
      sessionData.ipAddress = ipAddressValue;
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
    // If validation fails, delete invalid session and return null
    await redis.del(`dataroom_session:${sessionToken}`);
    return null;
  }
}

export async function verifyDataroomSessionInPagesRouter(
  req: NextApiRequest,
  linkId: string,
  dataroomId: string,
): Promise<DataroomSession | null> {
  if (!dataroomId) return null;

  const sessionData = await getDataroomSessionByLinkIdInPagesRouter(
    req,
    linkId,
  );
  if (!sessionData || sessionData.dataroomId !== dataroomId) return null;
  return sessionData;
}

/**
 * Get dataroom session by linkId only (e.g. for downloads page where dataroomId may not be in context).
 */
export async function getDataroomSessionByLinkIdInPagesRouter(
  req: NextApiRequest,
  linkId: string,
): Promise<DataroomSession | null> {
  if (!linkId) return null;

  const cookies = parse(req.headers.cookie || "");
  const sessionToken = cookies[getDataroomSessionCookieName(linkId)];
  const bindingToken = cookies[getDataroomSessionBindingCookieName(linkId)];
  if (!sessionToken) {
    return null;
  }

  const session = await redis.get(`dataroom_session:${sessionToken}`);
  if (!session) return null;

  try {
    const sessionData = parseDataroomSession(session);

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      await redis.del(`dataroom_session:${sessionToken}`);
      return null;
    }

    if (
      sessionData.clientBindingHash &&
      (!bindingToken ||
        !verifyBindingTokenHash(sessionData.clientBindingHash, bindingToken))
    ) {
      await redis.del(`dataroom_session:${sessionToken}`);
      return null;
    }

    // Keep IP for telemetry/watermark context only; do not invalidate session on IP rotation.
    const ipAddressValue = normalizeIp(getIpAddress(req.headers) ?? LOCALHOST_IP);
    if (ipAddressValue !== sessionData.ipAddress) {
      await redis.set(
        `dataroom_session:${sessionToken}`,
        JSON.stringify({ ...sessionData, ipAddress: ipAddressValue }),
        { pxat: sessionData.expiresAt },
      );
      sessionData.ipAddress = ipAddressValue;
    }

    if (sessionData.linkId !== linkId) {
      await redis.del(`dataroom_session:${sessionToken}`);
      return null;
    }

    return sessionData;
  } catch (error) {
    // If validation fails, delete invalid session and return null
    await redis.del(`dataroom_session:${sessionToken}`);
    return null;
  }
}

/**
 * Update the verified flag of an existing dataroom session (e.g. after OTP verification).
 * Caller must obtain sessionToken from the request cookie (pm_drs_{linkId}).
 */
export async function updateDataroomSessionVerified(
  sessionToken: string,
  verified: boolean,
): Promise<boolean> {
  if (!sessionToken) return false;

  const raw = await redis.get(`dataroom_session:${sessionToken}`);
  if (!raw) return false;

  try {
    const sessionData = parseDataroomSession(raw);
    if (sessionData.expiresAt < Date.now()) {
      await redis.del(`dataroom_session:${sessionToken}`);
      return false;
    }

    const updated: DataroomSession = { ...sessionData, verified };
    await redis.set(
      `dataroom_session:${sessionToken}`,
      JSON.stringify(updated),
      {
        pxat: sessionData.expiresAt,
      },
    );
    return true;
  } catch {
    return false;
  }
}

export { createDataroomSession, verifyDataroomSession };
export {
  getDataroomSessionCookieName,
  getDataroomSessionBindingCookieName,
};
