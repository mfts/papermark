import crypto from "crypto";

export function generateChecksum(url: string): string {
  // Use a secure secret key stored in environment variables
  const secret = process.env.NEXT_PRIVATE_VERIFICATION_SECRET!;

  // Create HMAC using SHA-256
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(url);

  // Return hex digest
  return hmac.digest("hex");
}
