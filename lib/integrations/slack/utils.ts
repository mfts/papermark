import crypto from "crypto";

export function encryptSlackToken(token: string): string {
  if (!token) return "";
  const textParts: string[] = token.split(":");
  if (textParts.length === 2) {
    return token;
  }
  const encryptionKey = process.env.NEXT_PRIVATE_SLACK_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error(
      "NEXT_PRIVATE_SLACK_ENCRYPTION_KEY environment variable is required for token encryption",
    );
  }

  const encryptedKey: string = crypto
    .createHash("sha256")
    .update(String(encryptionKey))
    .digest("base64")
    .substring(0, 32);

  const IV: Buffer = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-ctr", encryptedKey, IV);
  let encryptedText: string = cipher.update(token, "utf8", "hex");
  encryptedText += cipher.final("hex");

  return IV.toString("hex") + ":" + encryptedText;
}

export function decryptSlackToken(encryptedToken: string): string {
  if (!encryptedToken) return "";

  const encryptionKey = process.env.NEXT_PRIVATE_SLACK_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error(
      "NEXT_PRIVATE_SLACK_ENCRYPTION_KEY environment variable is required for token decryption",
    );
  }

  const encryptedKey: string = crypto
    .createHash("sha256")
    .update(String(encryptionKey))
    .digest("base64")
    .substring(0, 32);

  const textParts: string[] = encryptedToken.split(":");
  if (!textParts || textParts.length !== 2) {
    return encryptedToken;
  }

  const IV: Buffer = Buffer.from(textParts[0], "hex");
  const encryptedText: string = textParts[1];
  const decipher = crypto.createDecipheriv("aes-256-ctr", encryptedKey, IV);
  let decrypted: string = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
