import { google } from 'googleapis';
import prisma from "@/lib/prisma";
import { SUPPORTED_DOCUMENT_MIME_TYPES } from "@/lib/constants";

interface TokenResponse {
    access_token: string;
    expires_in: number;
}

export class GoogleDriveClient {
    private static instance: GoogleDriveClient;
    private auth: any;

    private constructor() {
        this.auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
    }

    // Get the instance of the GoogleDriveClient
    public static getInstance(): GoogleDriveClient {
        if (!GoogleDriveClient.instance) {
            GoogleDriveClient.instance = new GoogleDriveClient();
        }
        return GoogleDriveClient.instance;
    }

    // Refresh the access token
    public async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID as string,
                client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error === "invalid_grant") {
                throw new Error("REFRESH_TOKEN_EXPIRED");
            }
            throw new Error("Failed to refresh token");
        }

        return await response.json();
    }

    // Get the user's Google Drive integration
    public async getDriveClient(userId: string) {
        // Get the user's Google Drive integration
        const integration = await prisma.googleDriveIntegration.findUnique({
            where: { userId },
        });
        if (!integration) {
            throw new Error("Google Drive not connected");
        }

        // Check if token is expired
        if (new Date() > integration.expiresAt) {
            try {
                // Refresh the token
                const tokens = await this.refreshAccessToken(integration.refreshToken);

                // Calculate new expiration
                const expiresAt = new Date();
                expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

                // Update tokens in database
                await prisma.googleDriveIntegration.update({
                    where: { userId },
                    data: {
                        accessToken: tokens.access_token,
                        expiresAt,
                    },
                });

                // Use the new access token
                integration.accessToken = tokens.access_token;
            } catch (error) {
                if (error instanceof Error && error.message === "REFRESH_TOKEN_EXPIRED") {
                    throw new Error("RECONNECT_REQUIRED");
                }
                throw error;
            }
        }

        // Set credentials and return drive client
        this.auth.setCredentials({
            access_token: integration.accessToken,
            refresh_token: integration.refreshToken,
        });

        return google.drive({ version: 'v3', auth: this.auth });
    }

    // Function to list files with improvements
    public async listFiles(drive: any, folderId: string) {
        const folderMap = new Map();

        // Initialize the root folder
        const file = await drive.files.get({
            fileId: folderId,
            fields: 'name, parents'
        });
        folderMap.set(folderId, {
            folderId: folderId,
            folderName: file.data.name || 'Root',
            parentFolderId: file.data.parents?.[0] || null,
            files: []
        });

        // Function to process a folder and its contents
        const processFolder = async (currentFolderId: string) => {
            let nextPageToken;
            let response: any;

            do {
                try {
                    response = await drive.files.list({
                        q: `'${currentFolderId}' in parents and trashed = false`,
                        fields: 'nextPageToken, files(id, name, mimeType, parents)',
                        pageSize: 100,
                        orderBy: 'modifiedTime desc',
                        pageToken: nextPageToken,
                    });

                    // Process each item in the current folder
                    const folderPromises = response.data.files.map(async (item: any) => {
                        const resolvedItem = await handleGoogleDriveFile(item, drive);

                        if (resolvedItem.mimeType === 'application/vnd.google-apps.folder') {
                            const folderInfo = {
                                folderId: resolvedItem.id,
                                folderName: resolvedItem.name,
                                parentFolderId: currentFolderId,
                                files: []
                            };

                            folderMap.set(resolvedItem.id, folderInfo);

                            // Process this folder in parallel
                            return processFolder(resolvedItem.id);
                        } else if (SUPPORTED_DOCUMENT_MIME_TYPES.includes(resolvedItem.mimeType)) {
                            // Only add files with supported MIME types
                            const currentFolder = folderMap.get(currentFolderId);
                            if (currentFolder) {
                                currentFolder.files.push({
                                    fileId: resolvedItem.id,
                                    fileName: resolvedItem.name,
                                    fileType: resolvedItem.mimeType,
                                    googleDriveFolderId: currentFolderId
                                });
                            }
                        }
                    });

                    await Promise.all(folderPromises);

                    nextPageToken = response.data.nextPageToken;
                } catch (error) {
                    // Implement exponential backoff and retry logic here
                    console.error('Error fetching files:', error);
                    // Retry logic with exponential backoff
                }
            } while (nextPageToken);
        };

        // Start processing from the root folder
        await processFolder(folderId);

        // Convert the map to an array of folder objects
        return Array.from(folderMap.values());
    }

    // Download a file from Google Drive
    public async downloadFile(fileId: string, drive: any) {
        const file = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, mimeType',
        });
        const response = await drive.files.get(
            {
                fileId: fileId,
                alt: 'media',
            },
            { responseType: 'stream' }
        );
        return {
            metadata: file.data,
            stream: response.data
        };
    }

    public async revokeToken(refreshToken: string) {
        const response = await fetch("https://oauth2.googleapis.com/revoke", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                token: refreshToken,
                client_id: process.env.GOOGLE_CLIENT_ID as string,
                client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
            }),
        });
        if (!response.ok) {
            throw new Error("Failed to revoke token");
        }
        return true;
    }

    // Disconnect the Google Drive integration
    public async disconnectDrive(userId: string) {
        try {
            const integration = await prisma.googleDriveIntegration.findUnique({
                where: { userId },
            });
            if (!integration) {
                throw new Error("Google Drive not connected");
            }
            await this.revokeToken(integration.refreshToken);
            await prisma.googleDriveIntegration.delete({
                where: { userId },
            });
            return true;
        } catch (error) {
            console.error("Error disconnecting Google Drive:", error);
            return false;
        }
    }
}

// Export error types for better error handling
export const GOOGLE_DRIVE_ERRORS = {
    REFRESH_TOKEN_EXPIRED: "REFRESH_TOKEN_EXPIRED",
    RECONNECT_REQUIRED: "RECONNECT_REQUIRED",
    NOT_CONNECTED: "NOT_CONNECTED",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    INVALID_REQUEST: "INVALID_REQUEST"
} as const;

export type GoogleDriveError = typeof GOOGLE_DRIVE_ERRORS[keyof typeof GOOGLE_DRIVE_ERRORS];

// When processing files from Google Drive
async function handleGoogleDriveFile(file: any, drive: any) {
    if (file.mimeType === 'application/vnd.google-apps.shortcut') {
        // This is a shortcut, resolve it to get the actual file
        const shortcutDetails = await drive.files.get({
            fileId: file.id,
            fields: 'shortcutDetails'
        });

        // Get the target file ID from the shortcut
        const targetId = shortcutDetails.data.shortcutDetails.targetId;

        // Fetch the actual file using the target ID
        const targetFile = await drive.files.get({
            fileId: targetId,
            fields: 'id, name, mimeType, parents'
        });

        // Now use targetFile instead of the original file
        return targetFile.data;
    }
    // For non-shortcut files, return as is
    return file;
} 