import { customAlphabet } from "nanoid";

import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/resend";

import LoginLink from "@/components/emails/verification-link";

// Generate a 10-character uppercase alphanumeric verification code (like Linear's style)
const generateVerificationCode = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  10,
);

// Redis key prefixes for login codes
const LOGIN_CODE_PREFIX = "login_code:";
const LOGIN_CODE_EMAIL_PREFIX = "login_code:email:";
// Token expiration time in seconds (15 minutes)
const TOKEN_EXPIRATION_SECONDS = 15 * 60;

export interface MagicLinkData {
  email: string;
  code: string;
  uuid: string;
  callbackUrl: string;
  createdAt: number;
}

export const sendVerificationRequestEmail = async (params: {
  email: string;
  url: string;
}) => {
  const { url, email } = params;

  // Generate verification code and UUID
  const code = generateVerificationCode();
  const uuid = crypto.randomUUID();

  // Store the login data in Redis with 15-minute TTL
  const magicLinkData: MagicLinkData = {
    email,
    code,
    uuid,
    callbackUrl: url,
    createdAt: Date.now(),
  };

  // Store with UUID as primary key
  await redis.set(
    `${LOGIN_CODE_PREFIX}${uuid}`,
    JSON.stringify(magicLinkData),
    { ex: TOKEN_EXPIRATION_SECONDS },
  );

  // Store secondary key for code lookup: email:code -> uuid
  await redis.set(
    `${LOGIN_CODE_EMAIL_PREFIX}${email.toLowerCase()}:${code}`,
    uuid,
    { ex: TOKEN_EXPIRATION_SECONDS },
  );

  // Create verification URL with email, code, and uuid
  const encodedEmail = encodeURIComponent(email);
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/email/${encodedEmail}/${code}/${uuid}`;

  const emailTemplate = LoginLink({
    url: verificationUrl,
    email,
    code,
  });

  try {
    await sendEmail({
      to: email as string,
      system: true,
      subject: "Login for Papermark",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};

/**
 * Retrieve magic link data from Redis by UUID
 * Returns null if UUID doesn't exist or has expired (Redis handles TTL automatically)
 */
export const getMagicLinkData = async (
  uuid: string,
): Promise<MagicLinkData | null> => {
  try {
    const data = await redis.get(`${LOGIN_CODE_PREFIX}${uuid}`);
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

/**
 * Retrieve magic link data from Redis by email and code
 * Returns null if not found or expired
 */
export const getMagicLinkDataByCode = async (
  email: string,
  code: string,
): Promise<MagicLinkData | null> => {
  try {
    // Look up UUID from email:code key
    const uuid = await redis.get(
      `${LOGIN_CODE_EMAIL_PREFIX}${email.toLowerCase()}:${code.toUpperCase()}`,
    );
    if (!uuid || typeof uuid !== "string") return null;

    // Get the full data using the UUID
    return getMagicLinkData(uuid);
  } catch (error) {
    console.error("Error fetching magic link data by code:", error);
    return null;
  }
};

/**
 * Delete magic link data from Redis after successful use
 * This prevents the link from being reused
 */
export const deleteMagicLinkData = async (
  uuid: string,
  email?: string,
  code?: string,
): Promise<boolean> => {
  try {
    // Delete primary key
    const result = await redis.del(`${LOGIN_CODE_PREFIX}${uuid}`);

    // Delete secondary key if email and code are provided
    if (email && code) {
      await redis.del(
        `${LOGIN_CODE_EMAIL_PREFIX}${email.toLowerCase()}:${code.toUpperCase()}`,
      );
    }

    return result === 1;
  } catch (error) {
    console.error("Error deleting magic link data:", error);
    return false;
  }
};
