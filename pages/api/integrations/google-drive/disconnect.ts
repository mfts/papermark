import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { GoogleDriveClient } from "@/lib/google-drive";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const userId = (session.user as CustomUser).id;

        const success = await GoogleDriveClient.getInstance().disconnectDrive(userId);
        if (!success) {
            return res.status(500).json({ error: "Failed to disconnect Google Drive" });
        }
        return res.status(200).json({ message: "Successfully disconnected Google Drive" });
    } catch (error) {
        console.error("Error disconnecting Google Drive:", error);
        return res.status(500).json({ error: "Failed to disconnect Google Drive" });
    }
} 