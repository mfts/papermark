// lib/auth/link-session.ts
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { ipAddress } from "@vercel/functions";
import crypto from "crypto";
import { z } from "zod";

import { redis } from "@/lib/redis";
import { LOCALHOST_IP } from "@/lib/utils/geo";

const COOKIE_EXPIRATION_TIME = 23 * 60 * 60 * 1000; // 23 hours

export const LinkSessionSchema = z.object({
  linkId: z.string(),
  documentId: z.string().optional(), // For document links
  dataroomId: z.string().optional(), // For dataroom links
  viewId: z.string(),
  viewerId: z.string().optional(),
  email: z.string(),
  expiresAt: z.number(),
  ipAddress: z.string(),
  userAgent: z.string(),
  verified: z.boolean(),
  linkType: z.enum(["DOCUMENT_LINK", "DATAROOM_LINK", "WORKFLOW_LINK"]),
  // Security enhancements
  accessCount: z.number().default(0),
  maxAccesses: z.number().default(1000),
  lastAccessedAt: z.number(),
  createdAt: z.number(),
});

export type LinkSession = z.infer<typeof LinkSessionSchema>;

export async function createLinkSession(
  linkId: string,
  linkType: "DOCUMENT_LINK" | "DATAROOM_LINK",
  viewId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  verified: boolean,
  viewerId?: string,
  documentId?: string,
  dataroomId?: string,
): Promise<{ token: string; expiresAt: number }> {
  const sessionToken = crypto.randomBytes(48).toString("base64url");
  const expiresAt = Date.now() + COOKIE_EXPIRATION_TIME;
  const now = Date.now();

  const sessionData: LinkSession = {
    linkId,
    linkType,
    documentId,
    dataroomId,
    viewId,
    viewerId,
    email,
    expiresAt,
    ipAddress,
    userAgent,
    verified,
    accessCount: 1,
    maxAccesses: 1000,
    lastAccessedAt: now,
    createdAt: now,
  };

  LinkSessionSchema.parse(sessionData);

  await redis.set(`link_session:${sessionToken}`, JSON.stringify(sessionData), {
    pxat: expiresAt,
  });

  // Track active sessions per viewer (for revocation)
  if (viewerId) {
    await redis.sadd(`viewer_sessions:${viewerId}`, sessionToken);
    await redis.expire(
      `viewer_sessions:${viewerId}`,
      Math.floor(COOKIE_EXPIRATION_TIME / 1000),
    );
  }

  return { token: sessionToken, expiresAt };
}

export async function verifyLinkSession(
  request: NextRequest,
  linkId: string,
): Promise<LinkSession | null> {
  const sessionToken = cookies().get(`pm_ls_${linkId}`)?.value;

  if (!sessionToken) return null;

  const session = await redis.get(`link_session:${sessionToken}`);

  if (!session) return null;

  try {
    const sessionData = LinkSessionSchema.parse(session);

    // Check expiration
    if (sessionData.expiresAt < Date.now()) {
      await deleteLinkSession(sessionToken, sessionData.viewerId);
      return null;
    }

    // Verify IP address
    const currentIp = ipAddress(request) ?? LOCALHOST_IP;
    if (currentIp !== sessionData.ipAddress) {
      await deleteLinkSession(sessionToken, sessionData.viewerId);
      return null;
    }

    // Verify User Agent
    const currentUserAgent = request.headers.get("user-agent") ?? "unknown";
    if (currentUserAgent !== sessionData.userAgent) {
      await deleteLinkSession(sessionToken, sessionData.viewerId);
      return null;
    }

    // Check link ID matches
    if (sessionData.linkId !== linkId) {
      await deleteLinkSession(sessionToken, sessionData.viewerId);
      return null;
    }

    // Update access count and last accessed
    sessionData.accessCount += 1;
    sessionData.lastAccessedAt = Date.now();

    // Check access limit
    if (sessionData.accessCount > sessionData.maxAccesses) {
      await deleteLinkSession(sessionToken, sessionData.viewerId);
      return null;
    }

    // Rate limit check (max 100 requests per minute per session)
    const rateLimitKey = `rate_limit:session:${sessionToken}`;
    const requestCount = await redis.incr(rateLimitKey);
    if (requestCount === 1) {
      await redis.expire(rateLimitKey, 60);
    }
    if (requestCount > 100) {
      return null; // Rate limited
    }

    // Update session in Redis
    await redis.set(
      `link_session:${sessionToken}`,
      JSON.stringify(sessionData),
      { pxat: sessionData.expiresAt },
    );

    return sessionData;
  } catch (error) {
    console.error("Session verification error:", error);
    await redis.del(`link_session:${sessionToken}`);
    return null;
  }
}

async function deleteLinkSession(
  sessionToken: string,
  viewerId?: string,
): Promise<void> {
  await redis.del(`link_session:${sessionToken}`);
  if (viewerId) {
    await redis.srem(`viewer_sessions:${viewerId}`, sessionToken);
  }
}

export async function revokeLinkSession(linkId: string): Promise<void> {
  const sessionToken = cookies().get(`pm_ls_${linkId}`)?.value;
  if (sessionToken) {
    const session = await redis.get(`link_session:${sessionToken}`);
    if (session) {
      const sessionData = LinkSessionSchema.parse(session);
      await deleteLinkSession(sessionToken, sessionData.viewerId);
    }
  }
}
