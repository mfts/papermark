import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { GoogleDriveClient, GOOGLE_DRIVE_ERRORS } from "@/lib/google-drive";
import prisma from "@/lib/prisma";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    //POST api/integrations/google-drive/list-files

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get user session
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const userId = (session.user as CustomUser).id;
        const { folderIds, folderPathName, teamId, dataroomId } = req.body as { folderIds: string[], folderPathName: string, teamId: string, dataroomId: string };

        if (!folderIds || !Array.isArray(folderIds)) {
            return res.status(400).json({ error: 'Folder IDs are required' });
        }

        if (!teamId) {
            return res.status(400).json({ error: 'Team ID is required' });
        }
        if (dataroomId) {
            const dataroom = await prisma.dataroom.findUnique({
                where: {
                    id: dataroomId,
                    teamId: teamId
                }
            });
            if (!dataroom) {
                return res.status(404).json({ error: 'Dataroom not found' });
            }
        }
        console.log("----------------folderPathName ----------------");
        console.log('folderPathName', folderPathName);
        console.log("----------------folderPathName ----------------");

        // Get Google Drive client instance
        const googleDrive = GoogleDriveClient.getInstance();
        const driveClient = await googleDrive.getDriveClient(userId);
        // List files in the folder using the improved function
        const files: any[] = [];
        for (const folderId of folderIds) {

            try {
                const file = await googleDrive.listFiles(driveClient, folderId);
                files.push(...file);
            } catch (error) {
                console.error(`Error listing files for folder ${folderId}:`, error);
                return res.status(500).json({
                    error: 'Failed to list files',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        const fileArray = files.flatMap((file) => file.files);
        console.log("----------------files----------------");
        console.log('files', { files, fileArray });
        console.log("----------------files----------------");

        const tree = buildFolderTree(files, folderIds);

        console.log("----------------tree----------------");
        console.log('tree', tree);
        console.log("----------------tree----------------");

        return res.status(200).json({ tree, files: fileArray });
    } catch (error) {
        console.error('Error listing files:', error);

        if (error instanceof Error) {
            switch (error.message) {
                case GOOGLE_DRIVE_ERRORS.RECONNECT_REQUIRED:
                    return res.status(401).json({
                        error: "Google Drive connection expired",
                        message: "Please reconnect your Google Drive account",
                        requiresReconnect: true
                    });
                case GOOGLE_DRIVE_ERRORS.NOT_CONNECTED:
                    return res.status(404).json({
                        error: "Google Drive not connected",
                        message: "Please connect your Google Drive account"
                    });
            }
        }

        return res.status(500).json({
            error: 'Failed to list files',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

function buildFolderTree(data: any, selectedFolderIds: string[]) {
    const folderMap = new Map();

    // Step 1: Map all folders by their ID and add an empty children array
    for (const folder of data) {
        folderMap.set(folder.folderId, {
            ...folder,
            children: [],
        });
    }

    // Step 2: Link children to their parent
    for (const folder of data) {
        const parent = folderMap.get(folder.parentFolderId);
        if (parent) {
            parent.children.push(folderMap.get(folder.folderId));
        }
    }

    // Step 3: Return only selected root folders with their nested children
    const tree = [];
    for (const id of selectedFolderIds) {
        const rootFolder = folderMap.get(id);
        if (rootFolder) {
            tree.push(rootFolder);
        }
    }

    return tree;
}
