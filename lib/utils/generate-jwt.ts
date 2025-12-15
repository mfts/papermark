import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXT_PRIVATE_UNSUBSCRIBE_JWT_SECRET as string;

type JWTPayload = {
  [key: string]: any;
  exp?: number; // Expiration timestamp
};

/**
 * Generates a JWT token with the provided payload
 * @param payload The data to encode in the JWT
 * @param expiresInSeconds Optional expiration time in seconds (default: 24 hours)
 * @returns The signed JWT token
 */
export function generateJWT(
  payload: JWTPayload,
  expiresInSeconds: number = 60 * 60 * 24, // 24 hours
): string {
  const tokenPayload = {
    ...payload,
    exp: payload.exp || Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  return jwt.sign(tokenPayload, JWT_SECRET);
}

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token The JWT token to verify
 * @returns The decoded payload or null if invalid
 */
export function verifyJWT<T = JWTPayload>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (error) {
    return null;
  }
}
