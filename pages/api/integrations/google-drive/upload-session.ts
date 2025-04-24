import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { getGDriveUploadSession, deleteGDriveUploadSession } from "@/lib/auth/gdrive-upload-session";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Verify user is authenticated
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = (session.user as CustomUser).id;

    // Handle different HTTP methods
    switch (req.method) {
        case "GET": {
            // Retrieve upload session data
            try {
                const sessionToken = req.cookies.gdrive_upload_session;

                if (!sessionToken) {
                    return res.status(404).json({ error: "No active upload session" });
                }

                const uploadSession = await getGDriveUploadSession(sessionToken);

                if (!uploadSession) {
                    // Clear the invalid cookie
                    res.setHeader(
                        "Set-Cookie",
                        `gdrive_upload_session=; Path=/; HttpOnly; Max-Age=0`
                    );
                    return res.status(404).json({ error: "Session expired or invalid" });
                }

                // Make sure the session belongs to the current user
                if (uploadSession.userId !== userId) {
                    return res.status(403).json({ error: "Unauthorized session access" });
                }

                // Return the necessary data to continue with the upload
                return res.status(200).json({
                    jobId: uploadSession.jobId,
                    accessToken: uploadSession.accessToken,
                    teamId: uploadSession.teamId
                });
            } catch (error) {
                console.error("Error retrieving upload session:", error);
                return res.status(500).json({
                    error: error instanceof Error ? error.message : "Unknown error"
                });
            }
        }

        case "DELETE": {
            // Delete the session
            try {
                const sessionToken = req.cookies.gdrive_upload_session;

                if (sessionToken) {
                    // Get the session to verify ownership
                    const uploadSession = await getGDriveUploadSession(sessionToken);

                    if (uploadSession && uploadSession.userId === userId) {
                        await deleteGDriveUploadSession(sessionToken);
                    }
                }

                // Clear the cookie regardless of whether a valid session existed
                res.setHeader(
                    "Set-Cookie",
                    `gdrive_upload_session=; Path=/; HttpOnly; Max-Age=0`
                );

                return res.status(200).json({
                    success: true,
                    message: "Upload session cleared"
                });
            } catch (error) {
                console.error("Error deleting upload session:", error);
                return res.status(500).json({
                    error: error instanceof Error ? error.message : "Unknown error"
                });
            }
        }

        default:
            return res.status(405).json({ error: "Method not allowed" });
    }
}
