import { customAlphabet } from "nanoid";

import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/resend";

import LoginLink from "@/components/emails/verification-link";

// Generate a secure 20-character token using alphanumeric characters
const generateMagicLinkToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  20,
);

// Redis key prefix for magic link tokens
const MAGIC_LINK_PREFIX = "magic_link:";
// Token expiration time in seconds (24 hours)
const TOKEN_EXPIRATION_SECONDS = 24 * 60 * 60;

export interface MagicLinkData {
  email: string;
  callbackUrl: string;
  createdAt: number;
}

export const sendVerificationRequestEmail = async (params: {
  email: string;
  url: string;
}) => {
  const { url, email } = params;

  // Generate a short, unique token
  const token = generateMagicLinkToken();

  // Store the callback URL in Redis with 24-hour TTL
  const magicLinkData: MagicLinkData = {
    email,
    callbackUrl: url,
    createdAt: Date.now(),
  };

  await redis.set(
    `${MAGIC_LINK_PREFIX}${token}`,
    JSON.stringify(magicLinkData),
    { ex: TOKEN_EXPIRATION_SECONDS },
  );

  // Create simplified verification URL (under 100 characters)
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify?token=${token}`;

  // Calculate expiration time for the email
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_SECONDS * 1000);

  const emailTemplate = LoginLink({
    url: verificationUrl,
    email,
    expiresAt,
  });

  try {
    await sendEmail({
      to: email as string,
      system: true,
      subject: "Your Papermark Login Link",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};

/**
 * Retrieve magic link data from Redis
 * Returns null if token doesn't exist or has expired (Redis handles TTL automatically)
 */
export const getMagicLinkData = async (
  token: string,
): Promise<MagicLinkData | null> => {
  try {
    const data = await redis.get(`${MAGIC_LINK_PREFIX}${token}`);
    if (!data) return null;

    // Handle both string and already-parsed object (Redis client behavior)
    if (typeof data === "string") {
      return JSON.parse(data) as MagicLinkData;
    }
    return data as MagicLinkData;
  } catch (error) {
    console.error("Error fetching magic link data:", error);
    return null;
  }
};
