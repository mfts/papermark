import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXT_PRIVATE_UNSUBSCRIBE_JWT_SECRET as string;
const UNSUBSCRIBE_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL as string;

type UnsubscribePayload = {
  viewerId: string;
  teamId: string;
  dataroomId?: string;
  exp?: number; // Expiration timestamp
};

export function generateUnsubscribeUrl(payload: UnsubscribePayload): string {
  // Add expiration of 3 months
  const tokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET);
  return `${UNSUBSCRIBE_BASE_URL}/api/unsubscribe/${
    payload.dataroomId ? "dataroom" : "yir"
  }?token=${token}`;
}

export function verifyUnsubscribeToken(
  token: string,
): UnsubscribePayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UnsubscribePayload;
  } catch (error) {
    return null;
  }
}
