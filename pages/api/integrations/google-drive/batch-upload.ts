import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { Files, ProcessedFile } from "@/components/documents/add-document-modal";
import { batchFileUpload } from "@/lib/trigger/batch-file-upload";
import { tasks } from "@trigger.dev/sdk/v3";
import { getIpAddress } from "@/lib/utils/ip";
import { LOCALHOST_IP } from "@/lib/utils/geo";
import { createGDriveUploadSession } from "@/lib/auth/gdrive-upload-session";

// Configure cookie options
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { treeFiles, filesList, path, dataroomId, teamId } = req.body as { treeFiles: ProcessedFile, filesList: Files[], path: string, dataroomId: string, teamId: string };


    if (filesList.length === 0) {
        return res.status(400).json({ error: 'No files to upload' });
    }
    if (!teamId) {
        return res.status(400).json({ error: 'No team ID provided' });
    }

    try {
        const userId = (session.user as CustomUser).id;
        const ipAddressValue = getIpAddress(req.headers) ?? LOCALHOST_IP;
        // Trigger the batch file upload job
        const handle = await tasks.trigger<typeof batchFileUpload>("batch-file-upload", {
            files: filesList.map(file => ({
                id: file.fileId,
                name: file.fileName,
                type: file.fileType,
                size: 0,
                url: ""
            })),
            teamId,
            userId,
            folderTree: treeFiles,
            path: path,
            dataroomId
        });

        if (handle && handle.id && handle.publicAccessToken) {
            const { token: sessionToken, expiresAt } = await createGDriveUploadSession(
                handle.id,
                handle.publicAccessToken,
                userId,
                teamId,
                ipAddressValue
            );
            // Set secure HTTP-only cookie with the session token
            res.setHeader(
                "Set-Cookie",
                `gdrive_upload_session=${sessionToken}; ${Object.entries({
                    ...COOKIE_OPTIONS,
                    expires: new Date(expiresAt).toUTCString(),
                })
                    .map(([key, value]) => `${key}=${value}`)
                    .join("; ")
                }`
            );
        }

        return res.status(200).json({
            success: true,
            handle: handle,
            message: "Batch upload started successfully"
        });

    } catch (error) {
        console.error('Error in batch upload:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
} 