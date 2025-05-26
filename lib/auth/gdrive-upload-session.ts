import crypto from "crypto";
import { z } from "zod";
import { redis } from "@/lib/redis";

// Session expiration time (24 hours)
const SESSION_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

// Define the Zod schema for session data
export const GDriveUploadSessionSchema = z.object({
    jobId: z.string(),
    accessToken: z.string(),
    userId: z.string(),
    teamId: z.string(),
    expiresAt: z.number(),
    ipAddress: z.string().optional(),
});

// Generate TypeScript type from Zod schema
export type GDriveUploadSession = z.infer<typeof GDriveUploadSessionSchema>;

export async function createGDriveUploadSession(
    jobId: string,
    accessToken: string,
    userId: string,
    teamId: string,
    ipAddress?: string
): Promise<{ token: string; expiresAt: number }> {
    // Generate secure random token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + SESSION_EXPIRATION_TIME;

    const sessionData: GDriveUploadSession = {
        jobId,
        accessToken,
        userId,
        teamId,
        expiresAt,
        ipAddress,
    };

    // Validate session data before storing
    GDriveUploadSessionSchema.parse(sessionData);

    // Store session in Redis with expiration
    await redis.set(
        `gdrive_upload_session:${sessionToken}`,
        JSON.stringify(sessionData),
        { pxat: expiresAt }
    );

    return {
        token: sessionToken,
        expiresAt,
    };
}

export async function getGDriveUploadSession(
    sessionToken: string
): Promise<GDriveUploadSession | null> {
    if (!sessionToken) return null;

    const session = await redis.get(`gdrive_upload_session:${sessionToken}`);
    if (!session) return null;

    try {
        // Add explicit check for null and type assertion
        const sessionData = GDriveUploadSessionSchema.parse(
            typeof session === 'string' ? JSON.parse(session) : session
        );

        // Check if session is expired
        if (sessionData.expiresAt < Date.now()) {
            await redis.del(`gdrive_upload_session:${sessionToken}`);
            return null;
        }

        return sessionData;
    } catch (error) {
        console.error("GDrive upload session verification error:", error);
        // Delete invalid session
        await redis.del(`gdrive_upload_session:${sessionToken}`);
        return null;
    }
}

export async function deleteGDriveUploadSession(
    sessionToken: string
): Promise<boolean> {
    if (!sessionToken) return false;

    const deleted = await redis.del(`gdrive_upload_session:${sessionToken}`);
    return deleted > 0;
}