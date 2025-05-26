import crypto from "crypto";

/**
 * Encrypts a token using AES-256-CTR encryption
 * @param token The token to encrypt
 * @returns Encrypted token in format "iv:encryptedText"
 */
export function encryptToken(token: string): string {
    if (!token) return "";

    // If the token is already encrypted, return it
    const textParts: string[] = token.split(":");
    if (textParts.length === 2) {
        return token;
    }

    // Generate encryption key from environment variable
    const encryptedKey: string = crypto
        .createHash("sha256")
        .update(String(process.env.NEXT_PRIVATE_TOKEN_ENCRYPTION_KEY || process.env.NEXT_PRIVATE_DOCUMENT_PASSWORD_KEY))
        .digest("base64")
        .substring(0, 32);

    const IV: Buffer = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-ctr", encryptedKey, IV);
    let encryptedText: string = cipher.update(token, "utf8", "hex");
    encryptedText += cipher.final("hex");

    return IV.toString("hex") + ":" + encryptedText;
}

/**
 * Decrypts a token that was encrypted with encryptToken
 * @param encryptedToken The encrypted token in format "iv:encryptedText"
 * @returns Decrypted token
 */
export function decryptToken(encryptedToken: string): string {
    if (!encryptedToken) return "";

    // Generate encryption key from environment variable
    const encryptedKey: string = crypto
        .createHash("sha256")
        .update(String(process.env.NEXT_PRIVATE_TOKEN_ENCRYPTION_KEY || process.env.NEXT_PRIVATE_DOCUMENT_PASSWORD_KEY))
        .digest("base64")
        .substring(0, 32);

    const textParts: string[] = encryptedToken.split(":");
    if (!textParts || textParts.length !== 2) {
        return encryptedToken; // Return as-is if not encrypted
    }

    const IV: Buffer = Buffer.from(textParts[0], "hex");
    const encryptedText: string = textParts[1];
    const decipher = crypto.createDecipheriv("aes-256-ctr", encryptedKey, IV);
    let decrypted: string = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
} 