import { resumableUpload } from "./tus-upload";
import { GoogleDriveClient } from "../google-drive";
import { logger } from "@trigger.dev/sdk/v3";
import { countPdfPages } from "../utils/node-pdf-page-counter";
import slugify from "@sindresorhus/slugify";
import { ProcessedFile } from "@/components/documents/add-document-modal";
import { createFolderRecord, findFolderRecord } from "./file-utils";

export type ProgressCallback = (fileId: string, bytesUploaded: number, bytesTotal: number) => void;

// Helper function to create folder structure from ProcessedFile tree structure
export async function createFolderStructureFromTree(
    dataroomId: string | null = null,
    folderTree: ProcessedFile,
    teamId: string,
    basePath: string = "",
    parentFolderId: string | null = null,
    folderRenames: Map<string, string> = new Map<string, string>(),
    folderCreateCache: Map<string, string> = new Map<string, string>(),
    parentPath: string = "",
) {
    // Initialize uniqueFolderName with folder name from the tree
    let uniqueFolderName = folderTree.folderName;

    // Skip creating the folder if it's the root folder with ID "root"
    if (folderTree.folderId !== "root") {
        // Process current folder if it's not already in the cache
        if (!folderCreateCache.has(folderTree.folderId)) {
            // Create folder path
            let folderPath;
            // If a base path was provided (from the UI), use it as prefix
            if (basePath) {
                if (parentPath) {
                    folderPath = `${basePath}/${parentPath}/${slugify(folderTree.folderName)}`;
                } else {
                    folderPath = `${basePath}/${slugify(folderTree.folderName)}`;
                }
            } else {
                folderPath = parentPath
                    ? `${parentPath}/${slugify(folderTree.folderName)}`
                    : `/${slugify(folderTree.folderName)}`;
            }

            // Ensure path starts with slash
            if (!folderPath.startsWith('/')) {
                folderPath = `/${folderPath}`;
            }

            // Use the parentFolderId passed from the parent rather than the one in folderTree
            // This ensures correct parent-child relationships even if folderTree.parentFolderId is wrong
            const dbParentId = parentFolderId
                ? folderCreateCache.get(parentFolderId) || parentFolderId
                : null;

            logger.info("dbParentId", { dbParentId });

            // Check if a folder with the same name already exists in the same parent
            const originalFolderName = folderTree.folderName;
            const originalFolderPath = folderPath;
            let uniqueFolderPath = originalFolderPath;
            uniqueFolderName = originalFolderName; // Re-assign to ensure we start with the original name
            let counter = 1;

            let existingFolder = await findFolderRecord({
                name: uniqueFolderName,
                teamId: teamId,
                parentId: dbParentId,
                dataroomId: dataroomId,
                path: uniqueFolderPath
            });
            logger.info("existingFolder", { existingFolder });
            // If a folder with the same name exists, add a numbered suffix until a unique name is found
            while (existingFolder) {
                uniqueFolderName = `${originalFolderName} (${counter})`;
                uniqueFolderPath = originalFolderPath.replace(slugify(originalFolderName), slugify(uniqueFolderName));
                counter++;
                existingFolder = await findFolderRecord({
                    name: uniqueFolderName,
                    teamId: teamId,
                    parentId: dbParentId,
                    dataroomId: dataroomId,
                    path: uniqueFolderPath
                });
            }

            // If the folder name was changed, update the folder path
            if (uniqueFolderName !== originalFolderName) {
                const pathParts = uniqueFolderPath.split('/');
                pathParts[pathParts.length - 1] = slugify(uniqueFolderName);
                uniqueFolderPath = pathParts.join('/');

                // Store the renamed folder name in the map
                folderRenames.set(folderTree.folderId, uniqueFolderName);
            }

            // Create the folder in our database
            logger.info(`Creating folder: ${uniqueFolderName}`, {
                originalFolderName,
                originalFolderPath,
                uniqueFolderName,
                uniqueFolderPath,
                folderTreeParentId: folderTree.parentFolderId, // From the tree
                actualParentId: parentFolderId, // What we're using
                dbParentId: dbParentId, // The database ID we'll use
            });

            const folder = await createFolderRecord({
                dataroomId,
                name: uniqueFolderName,
                path: uniqueFolderPath,
                teamId,
                googleDriveFolderId: folderTree.folderId,
                parentId: dbParentId
            });
            // Cache the created folder's ID for reference by child folders
            folderCreateCache.set(folderTree.folderId, folder.id);
        }
    }

    // Process children recursively if they exist
    if (folderTree.children && folderTree.children.length > 0) {
        // If this is the root folder, pass empty parentPath or basePath so children become root-level folders
        // For other folders, use the uniqueFolderName if it was renamed
        const currentFolderPath = folderTree.folderId === "root"
            ? ""
            : parentPath
                ? `${parentPath}/${slugify(uniqueFolderName || folderTree.folderName)}`
                : `${slugify(uniqueFolderName || folderTree.folderName)}`;

        for (const childFolder of folderTree.children) {
            await createFolderStructureFromTree(
                dataroomId,
                childFolder,
                teamId,
                basePath,
                folderTree.folderId === "root" ? parentFolderId : folderTree.folderId, // Pass current folder ID as parent for children, if it's the root folder, pass the parentFolderId passed from the parent
                folderRenames,
                folderCreateCache,
                currentFolderPath,
            );
        }
    }

    return folderCreateCache;
}

export async function processAndUploadFiles(
    fileIds: string[],
    teamId: string,
    ownerId: string,
    onProgress?: ProgressCallback,
    onError?: (error: Error) => void,
    folderTree?: ProcessedFile,
    path?: string,
    preBuildFolderRenames?: Map<string, string>
) {
    const results = [];
    const drive = await GoogleDriveClient.getInstance().getDriveClient(ownerId);

    // Map to store information about Google Drive folders
    const folderMap = new Map();
    const fileInfo = new Map();
    // Map to track folder renames (folderId -> renamed folder name)
    const folderRenames = preBuildFolderRenames || new Map<string, string>();

    // Find folder information for each file from folderTree if available
    if (folderTree) {
        // Create a map to store folder paths for quick lookup
        const folderPathMap = new Map<string, { path: string; parentId: string | null }>();

        // Function to build folder paths recursively
        const buildFolderPaths = (folder: ProcessedFile, parentPath: string = "", parentFolderId: string | null = null) => {
            // Skip the root folder in the path if its ID is "root"
            if (folder.folderId === "root") {
                // For root folder, just process children without adding to path
                if (folder.children) {
                    for (const child of folder.children) {
                        // Pass null as parentFolderId since root is not a real folder
                        buildFolderPaths(child, "", null);
                    }
                }
                return;
            }

            // Get the renamed folder name if it exists, otherwise use the original
            const actualFolderName = folderRenames.get(folder.folderId) || folder.folderName;

            // Build the current folder's path
            let currentPath;

            // If a base path was provided (from the UI), use it as prefix for root-level folders
            if (path && parentPath === "") {
                currentPath = `${path}/${slugify(actualFolderName)}`;
            } else {
                currentPath = parentPath
                    ? `${parentPath}/${slugify(actualFolderName)}`
                    : slugify(actualFolderName);
            }

            // Store the folder path and keep track of the parent folder ID relationship
            folderPathMap.set(folder.folderId, {
                path: currentPath,
                parentId: parentFolderId // Store the actual parent ID, not from the folderTree
            });

            // Process children recursively
            if (folder.children) {
                for (const child of folder.children) {
                    buildFolderPaths(child, currentPath, folder.folderId);
                }
            }
        };

        // Always build all folder paths starting from the root, whether folders were pre-created or not
        buildFolderPaths(folderTree);

        const collectFileInfo = (folder: ProcessedFile) => {
            // Process files in this folder
            for (const file of folder.files || []) {
                // Don't associate files directly with the root folder
                const parentId = folder.folderId === "root" ? null : folder.folderId;
                const folderPath = parentId ? folderPathMap.get(parentId)?.path : undefined;

                fileInfo.set(file.fileId, {
                    id: file.fileId,
                    name: file.fileName,
                    mimeType: file.fileType,
                    parentId: parentId,
                    folderPathName: folderPath
                });
            }

            // Process children recursively
            if (folder.children && folder.children.length > 0) {
                for (const child of folder.children) {
                    collectFileInfo(child);
                }
            }
        };

        // Start collecting file info from the root folder
        collectFileInfo(folderTree);
    }

    // Now process and upload each file
    for (const fileId of fileIds) {
        try {
            // Download file from Google Drive
            const downloadResult = await GoogleDriveClient.getInstance().downloadFile(fileId, drive);
            const { metadata, stream } = downloadResult;
            // Convert stream to buffer
            let buffer: Buffer;
            if (stream && typeof stream.pipe === 'function') {
                // If it's a Node.js stream
                buffer = await new Promise<Buffer>((resolve, reject) => {
                    const chunks: Buffer[] = [];
                    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                    stream.on('error', reject);
                });
            } else if (stream && typeof stream === 'object') {
                // If it's already a buffer or array-like object
                if (stream._readableState && stream._readableState.buffer) {
                    // Handle PassThrough stream with buffer
                    buffer = Buffer.concat(stream._readableState.buffer);
                } else {
                    buffer = Buffer.from(stream);
                }
            } else {
                throw new Error('Invalid stream format received from Google Drive');
            }

            // count the number of pages in the file
            let numPages = 1;
            if (metadata.mimeType === "application/pdf") {
                try {
                    numPages = await countPdfPages(buffer);
                } catch (error) {
                    logger.error('Error counting pages', { error });
                    numPages = 1;
                }
            }

            // Get the folder ID from our mapping
            const fileData = fileInfo.get(fileId);
            logger.info('fileData', { fileData });
            const googleDriveFolderId = fileData?.parentId || null;
            const googleDriveFileId = fileData?.id || fileId;
            logger.info('googleDriveFolderId', { googleDriveFolderId });

            // Get folder path name from fileInfo or build it from folder map
            let folderPathName = fileData?.folderPathName || "";

            // If folderPathName is not in fileInfo, try to build it from folderMap (for backward compatibility)
            //for safety, not needed
            if (!folderPathName && googleDriveFolderId && folderMap.has(googleDriveFolderId)) {
                const folder = folderMap.get(googleDriveFolderId);
                folderPathName = slugify(folder.folderName);

                // If the folder has parents, build the full path
                let parentId = folder.parentFolderId;
                if (parentId && folderMap.has(parentId)) {
                    let ancestors: string[] = [];
                    while (parentId && folderMap.has(parentId)) {
                        const parentFolder = folderMap.get(parentId);
                        ancestors.unshift(slugify(parentFolder.folderName));
                        parentId = parentFolder.parentFolderId;
                    }
                    folderPathName = [...ancestors, folderPathName].join('/');
                }
            }

            // Upload the file using resumableUpload
            const { complete } = await resumableUpload({
                file: buffer,
                fileName: metadata.name,
                fileType: metadata.mimeType,
                ownerId,
                teamId,
                numPages: numPages,
                relativePath: metadata.name,
                googleDriveFileId,
                onProgress: onProgress ? (bytesUploaded, bytesTotal) => {
                    onProgress(fileId, bytesUploaded, bytesTotal);
                } : undefined,
                onError: onError ? (error) => {
                    onError(error);
                } : undefined,
            });

            // Wait for the upload to complete
            const uploadResult = await complete;
            results.push({
                success: true,
                fileId,
                fileName: metadata.name,
                uploadResult,
                folderPathName: folderPathName || path,
                googleDriveFileId,
                fileSize: metadata.fileSize
            });

        } catch (error) {
            logger.error(`Error processing file ${fileId}:`, { error: error instanceof Error ? error.message : String(error) });
            results.push({
                success: false,
                fileId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    return {
        totalFiles: fileIds.length,
        successfulUploads: results.filter(r => r.success).length,
        failedUploads: results.filter(r => !r.success).length,
        results,
    };
} 