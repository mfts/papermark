import { logger, task, metadata } from "@trigger.dev/sdk/v3";
import { createFolderStructureFromTree, processAndUploadFiles } from "@/lib/files/process-and-upload";
import { ProcessedFile } from "@/components/documents/add-document-modal";
import { createDocument } from "@/lib/documents/create-document";
import { getSupportedContentType } from "../utils/get-content-type";
import { hashToken } from "@/lib/api/auth/token";
import prisma from "@/lib/prisma";
import { newId } from "@/lib/id-helper";
import { findFolderRecordByPath } from "../files/file-utils";
import { DocumentCreationStatus, UploadStatus } from "../hooks/use-google-drive-upload";

// Define the payload type for our trigger
type BatchFileUploadPayload = {
    files: Array<{
        id: string;
        name: string;
        type: string;
        size: number;
        url: string;
    }>;
    userId: string;
    teamId: string;
    folderTree: ProcessedFile;
    path?: string;
    dataroomId?: string;
};

// Helper function to split array into chunks
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// Define the trigger task
export const batchFileUpload = task({
    id: "batch-file-upload",
    retry: { maxAttempts: 3 },
    queue: {
        concurrencyLimit: 5,
    },
    run: async (payload: BatchFileUploadPayload, { ctx }) => {
        const { files, userId, teamId, folderTree, path, dataroomId } = payload;

        // Generate a temporary API token for document creation
        const temporaryToken = newId("doc");
        const hashedToken = hashToken(temporaryToken);

        // Store token temporarily in database for authentication
        const tokenRecord = await prisma.restrictedToken.create({
            data: {
                name: "Batch Upload Token",
                hashedKey: hashedToken,
                partialKey: `${temporaryToken.slice(0, 3)}...${temporaryToken.slice(-4)}`,
                teamId,
                userId,
            },
        });

        let folderRenames = new Map<string, string>();
        // Create folder structure first, before processing any files
        if (folderTree.children && folderTree.children.length > 0) {
            logger.info("Creating folder structure before processing files");
            try {
                let parentFolderId: string | null = null;
                if (path) {
                    const folder = await findFolderRecordByPath({
                        path: '/' + path,
                        teamId: teamId,
                        dataroomId: dataroomId ?? null
                    });
                    if (folder) {
                        parentFolderId = folder.id;
                    }
                }

                // Import the function to create folders from folderTree
                await createFolderStructureFromTree(dataroomId, folderTree, teamId, path, parentFolderId, folderRenames);
            } catch (error) {
                logger.error("Error creating folder structure:", {
                    error: error instanceof Error ? error.message : String(error)
                });
            } finally {
                metadata.set("isFolderStructureCreated", true);
            }
        }
        // Split files into chunks of 3 for parallel processing
        const chunks = chunkArray(files, 3);
        let completedFiles = 0;
        let failedUploads = 0;
        let successfulUploads = 0;

        // Initialize metadata for progress tracking
        metadata.set("totalFiles", files.length);
        metadata.set("completedFiles", 0);
        metadata.set("failedUploads", 0);
        metadata.set("successfulUploads", 0);
        metadata.set("status", "in_progress");

        // Initialize file progress tracking
        const fileProgress: Record<string, {
            progress: number;
            status: UploadStatus;
            error?: string;
            fileName?: string;
            startTime?: number;
            endTime?: number;
            fileSize?: number;
            bytesUploaded?: number;
            bytesTotal?: number;
            retryCount?: number;
            documentCreated?: boolean;
            documentCreationStatus?: DocumentCreationStatus;
            documentCreationError?: string;
            documentId?: string;
            dataroomAddStatus?: DocumentCreationStatus;
            dataroomAddError?: string;
        }> = {};

        files.forEach(file => {
            fileProgress[file.id] = {
                progress: 0,
                status: "pending",
                fileName: file.name,
                startTime: Date.now(),
                fileSize: file.size || 0,
                retryCount: 0,
                documentCreated: false,
                documentCreationStatus: "pending",
                documentCreationError: undefined,
                documentId: undefined,
                dataroomAddStatus: dataroomId ? "pending" : undefined,
                dataroomAddError: undefined
            };
        });
        metadata.set("fileProgress", fileProgress);

        // Process each batch of 3 files in parallel
        const allDocumentPromises: Promise<any>[] = [];
        for (const batch of chunks) {
            try {
                logger.info(`Processing batch of ${batch.length} files`);

                const result = await processAndUploadFiles(
                    batch.map(file => file.id),
                    teamId,
                    userId,
                    async (fileId: string, bytesUploaded: number, bytesTotal: number) => {
                        const progress = Math.round((bytesUploaded / bytesTotal) * 100);
                        const currentTime = Date.now();

                        // Update individual file progress with detailed status
                        const currentFileProgress = fileProgress[fileId] || {
                            progress: 0,
                            status: "pending",
                            startTime: currentTime
                        };

                        // Determine appropriate status based on progress and previous state
                        let status = currentFileProgress.status;
                        if (progress === 100) {
                            status = "completed";

                            // Record completion time for metrics
                            fileProgress[fileId] = {
                                ...currentFileProgress,
                                progress,
                                status,
                                bytesUploaded,
                                bytesTotal,
                                endTime: currentTime
                            };

                            completedFiles++;
                            metadata.set("completedFiles", completedFiles);
                            metadata.set("progress", Math.round((completedFiles / files.length) * 100));
                        } else if (progress > 0) {
                            status = "processing"; // Active upload

                            // Record upload progress details
                            fileProgress[fileId] = {
                                ...currentFileProgress,
                                progress,
                                status,
                                bytesUploaded,
                                bytesTotal
                            };
                        } else if (currentFileProgress.status === "pending") {
                            status = "initializing"; // Just starting

                            fileProgress[fileId] = {
                                ...currentFileProgress,
                                progress: 0,
                                status,
                                bytesUploaded: 0,
                                bytesTotal
                            };
                        }

                        metadata.set("fileProgress", fileProgress);
                    },
                    (error: Error) => {
                        // Find the file ID that failed
                        const failedFileId = batch.find(file =>
                            !fileProgress[file.id] ||
                            (fileProgress[file.id].status !== "completed" &&
                                fileProgress[file.id].status !== "failed")
                        )?.id;

                        logger.error("Error processing file:", {
                            error: error.message,
                            fileId: failedFileId || "unknown"
                        });

                        failedUploads++;
                        metadata.set("failedUploads", failedUploads);

                        // Update file status to failed if we found the file
                        if (failedFileId) {
                            const currentFileProgress = fileProgress[failedFileId];
                            const retryCount = (currentFileProgress?.retryCount || 0) + 1;

                            fileProgress[failedFileId] = {
                                ...currentFileProgress,
                                progress: 0,
                                status: "failed",
                                error: `${error.message} (Try ${retryCount}/3)`,
                                endTime: Date.now(),
                                retryCount
                            };
                            metadata.set("fileProgress", fileProgress);
                        }
                    },
                    folderTree,
                    path,
                    folderRenames
                );
                // Process each successful upload to create documents with proper folder information
                if (result.results) {
                    for (const fileResult of result.results) {
                        if (fileResult.success && fileResult.uploadResult) {
                            try {
                                // Find the corresponding file in files array to get file type
                                const originalFile = files.find(f => f.id === fileResult.fileId);

                                if (originalFile) {

                                    let contentType = fileResult.uploadResult.fileType;
                                    let supportedFileType = getSupportedContentType(contentType) ?? "";

                                    if (
                                        fileResult.uploadResult.fileName.endsWith(".dwg") ||
                                        fileResult.uploadResult.fileName.endsWith(".dxf")
                                    ) {
                                        supportedFileType = "cad";
                                        contentType = `image/vnd.${fileResult.uploadResult.fileName.split(".").pop()}`;
                                    }

                                    if (fileResult.uploadResult.fileName.endsWith(".xlsm")) {
                                        supportedFileType = "sheet";
                                        contentType = "application/vnd.ms-excel.sheet.macroEnabled.12";
                                    }

                                    if (
                                        fileResult.uploadResult.fileName.endsWith(".kml") ||
                                        fileResult.uploadResult.fileName.endsWith(".kmz")
                                    ) {
                                        supportedFileType = "map";
                                        contentType = `application/vnd.google-earth.${fileResult.uploadResult.fileName.endsWith(".kml") ? "kml+xml" : "kmz"}`;
                                    }
                                    logger.info(`Creating document: ${fileResult.fileName} with folder path: ${fileResult.folderPathName}`, {
                                        fileName: fileResult.fileName,
                                        folderPathName: fileResult.folderPathName,
                                        googleDriveFileId: fileResult.googleDriveFileId
                                    });

                                    // Update file progress to show document creation in progress
                                    fileProgress[fileResult.fileId] = {
                                        ...fileProgress[fileResult.fileId],
                                        documentCreationStatus: "in_progress"
                                    };
                                    metadata.set("fileProgress", fileProgress);

                                    // Create a promise for document creation and add to tracking array
                                    const documentPromise = (async () => {
                                        try {
                                            // Create document with folder information
                                            const doc = await createDocument({
                                                documentData: {
                                                    name: fileResult.fileName,
                                                    key: fileResult.uploadResult.id,
                                                    storageType: "S3_PATH",
                                                    supportedFileType: supportedFileType,
                                                    contentType: contentType,
                                                    fileSize: fileResult.fileSize,
                                                },
                                                teamId,
                                                numPages: fileResult.uploadResult.numPages,
                                                folderPathName: fileResult.folderPathName,
                                                googleDriveFileId: fileResult.googleDriveFileId,
                                                token: temporaryToken,
                                            });
                                            const document = await doc.json();

                                            // Update file progress to show document creation completed
                                            fileProgress[fileResult.fileId] = {
                                                ...fileProgress[fileResult.fileId],
                                                documentCreated: true,
                                                documentCreationStatus: "completed",
                                                documentId: document.id
                                            };
                                            metadata.set("fileProgress", fileProgress);

                                            if (dataroomId) {
                                                try {
                                                    // Update file progress to show dataroom addition in progress
                                                    fileProgress[fileResult.fileId] = {
                                                        ...fileProgress[fileResult.fileId],
                                                        dataroomAddStatus: "in_progress"
                                                    };
                                                    metadata.set("fileProgress", fileProgress);

                                                    const res = await fetch(
                                                        `${process.env.NEXT_PUBLIC_BASE_URL}/api/teams/${teamId}/datarooms/${dataroomId}/documents`,
                                                        {
                                                            method: "POST",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                ...(temporaryToken ? { Authorization: `Bearer ${temporaryToken}` } : {}),
                                                            },
                                                            body: JSON.stringify({
                                                                documentId: document.id,
                                                                folderPathName: fileResult.folderPathName,
                                                                delay: 0,
                                                                googleDriveFileId: fileResult.googleDriveFileId
                                                            }),
                                                        },
                                                    );

                                                    if (res.ok) {
                                                        logger.info("document added to dataroom", { documentId: document.id });
                                                        fileProgress[fileResult.fileId] = {
                                                            ...fileProgress[fileResult.fileId],
                                                            dataroomAddStatus: "completed"
                                                        };
                                                        metadata.set("fileProgress", fileProgress);
                                                    } else {
                                                        const errorData = await res.json();
                                                        throw new Error(errorData.error || "Failed to add document to dataroom");
                                                    }
                                                } catch (error) {
                                                    console.error(
                                                        "An error occurred while adding document to the dataroom: ",
                                                        error,
                                                    );

                                                    // Update file progress to show dataroom addition failed
                                                    fileProgress[fileResult.fileId] = {
                                                        ...fileProgress[fileResult.fileId],
                                                        dataroomAddStatus: "failed",
                                                        dataroomAddError: error instanceof Error ? error.message : "Unknown error adding to dataroom"
                                                    };
                                                    metadata.set("fileProgress", fileProgress);
                                                }
                                            }

                                            // Log successful document creation
                                            logger.info(`Created document from file ${fileResult.fileName} with folder information`, {
                                                fileName: fileResult.fileName,
                                                folderPathName: fileResult.folderPathName,
                                                googleDriveFileId: fileResult.googleDriveFileId
                                            });
                                        } catch (docError) {
                                            logger.error(`Error creating document for file ${fileResult.fileName}:`, {
                                                error: docError instanceof Error ? docError.message : String(docError)
                                            });

                                            // Update file progress to show document creation failed
                                            fileProgress[fileResult.fileId] = {
                                                ...fileProgress[fileResult.fileId],
                                                documentCreated: false,
                                                documentCreationStatus: "failed",
                                                documentCreationError: docError instanceof Error ? docError.message : String(docError)
                                            };
                                            metadata.set("fileProgress", fileProgress);
                                        }
                                    })();

                                    // Add the promise to our tracking array
                                    allDocumentPromises.push(documentPromise);
                                }
                            } catch (docError) {
                                // This catch is now for any errors that occur before documentPromise is created
                                logger.error(`Error setting up document creation for file ${fileResult.fileName}:`, {
                                    error: docError instanceof Error ? docError.message : String(docError)
                                });

                                fileProgress[fileResult.fileId] = {
                                    ...fileProgress[fileResult.fileId],
                                    documentCreated: false,
                                    documentCreationStatus: "failed",
                                    documentCreationError: docError instanceof Error ? docError.message : String(docError)
                                };
                                metadata.set("fileProgress", fileProgress);
                            }
                        }
                    }
                }
                successfulUploads += result.successfulUploads;
                failedUploads += result.failedUploads;
                metadata.set("successfulUploads", successfulUploads);
                metadata.set("failedUploads", failedUploads);
            } catch (error) {
                logger.error("Error processing batch:", { error: error instanceof Error ? error.message : String(error) });
                failedUploads += batch.length;
                metadata.set("failedUploads", failedUploads);

                // Mark all files in the batch as failed
                batch.forEach(file => {
                    fileProgress[file.id] = {
                        progress: 0,
                        status: "failed",
                        error: error instanceof Error ? error.message : "Unknown error",
                        fileName: file.name,
                        documentCreated: false,
                        documentCreationStatus: "failed",
                        documentCreationError: error instanceof Error ? error.message : "Unknown error",
                        startTime: Date.now(),
                        fileSize: file.size || 0,
                        retryCount: 0
                    };
                });
                metadata.set("fileProgress", fileProgress);
            }
        }
        // Wait for all document creation processes to complete
        await Promise.all(allDocumentPromises);

        // Get a fresh snapshot of all file statuses after promises complete
        const finalFileProgress = { ...fileProgress };
        logger.info("finalFileProgress", { finalFileProgress });
        let statusFixCount = 0;

        // Run a final comprehensive status check and correction //backup status check and update
        for (const fileId in finalFileProgress) {
            const file = finalFileProgress[fileId];

            // Check for inconsistent document creation states that need fixing
            if (file.status === "completed") {
                // For completed uploads, document creation should always be completed
                if (file.documentCreationStatus === "in_progress" || file.documentCreationStatus === "pending") {
                    statusFixCount++;
                    file.documentCreationStatus = "completed";
                    file.documentCreationError = undefined;
                    file.documentCreated = true;

                    logger.info(`Fixed document status for ${file.fileName || fileId}`, {
                        fileId,
                        oldStatus: file.documentCreationStatus,
                        newStatus: "completed"
                    });
                }

                // If dataroom exists, ensure dataroom status is synced
                if (dataroomId && file.documentCreationStatus === "completed") {
                    if (file.dataroomAddStatus === "in_progress") {
                        statusFixCount++;
                        file.dataroomAddStatus = "completed";
                        file.dataroomAddError = undefined;

                        logger.info(`Fixed dataroom status for ${file.fileName || fileId}`, {
                            fileId,
                            oldStatus: file.dataroomAddStatus,
                            newStatus: "completed"
                        });
                    }
                }
            } else if (file.status === "failed") {
                // For failed uploads, document creation should reflect failure
                if (file.documentCreationStatus === "in_progress" || file.documentCreationStatus === "pending") {
                    statusFixCount++;
                    file.documentCreationStatus = "failed";
                    file.documentCreationError = file.documentCreationError || "Upload failed";
                    file.documentCreated = false;

                    // Also update dataroom status to failed if needed
                    if (dataroomId && (file.dataroomAddStatus === "in_progress" || file.dataroomAddStatus === "pending")) {
                        file.dataroomAddStatus = "failed";
                        file.dataroomAddError = "Document creation failed";
                    }

                    logger.info(`Updated status for failed file ${file.fileName || fileId}`, { fileId });
                }
            }
        }

        // If any fixes were made, update metadata once with all changes
        if (statusFixCount > 0) {
            logger.info(`Final status correction for ${statusFixCount} files`);

            // Replace entire fileProgress object to avoid partial updates
            metadata.set("fileProgress", finalFileProgress);

            // Make sure to flush metadata to ensure it's saved
            try {
                await metadata.flush();
                // Small delay to ensure changes propagate
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (flushError) {
                logger.warn("Error flushing metadata updates:", {
                    error: flushError instanceof Error ? flushError.message : String(flushError)
                });
                // Continue despite flush error - the metadata might still be saved
            }
        }

        // Update the success/failure counts one final time to ensure consistency
        const fileStatusCounts = Object.values(finalFileProgress).reduce((counts, file) => {
            if (file.status === "completed" && file.documentCreationStatus === "completed") {
                counts.success++;
            } else if (file.status === "failed" || file.documentCreationStatus === "failed") {
                counts.failed++;
            }
            return counts;
        }, { success: 0, failed: 0 });

        // Ensure our success/failure counts match the file status counts
        if (fileStatusCounts.success !== successfulUploads || fileStatusCounts.failed !== failedUploads) {
            logger.info("Updating final counts to match file status", {
                oldSuccessful: successfulUploads,
                newSuccessful: fileStatusCounts.success,
                oldFailed: failedUploads,
                newFailed: fileStatusCounts.failed
            });

            successfulUploads = fileStatusCounts.success;
            failedUploads = fileStatusCounts.failed;
            metadata.set("successfulUploads", successfulUploads);
            metadata.set("failedUploads", failedUploads);
        }

        logger.info("batchFileUpload final status", {
            totalFiles: files.length,
            successfulUploads,
            failedUploads,
            statusFixCount
        });

        // Update final job status
        if (failedUploads === 0) {
            metadata.set("status", "completed");
            metadata.set("progress", 100);
        } else if (successfulUploads === 0) {
            metadata.set("status", "failed");
            metadata.set("error", "All uploads failed");
        } else {
            metadata.set("status", "completed");
            metadata.set("error", `${failedUploads} uploads failed`);
            metadata.set("progress", Math.round((successfulUploads / files.length) * 100));
        }

        // Clean up the temporary token
        try {
            await prisma.restrictedToken.delete({
                where: { id: tokenRecord.id }
            });
        } catch (error) {
            logger.error("Failed to delete temporary token", {
                error: error instanceof Error ? error.message : String(error)
            });
        }

        // Ensure all pending operations are complete
        logger.info("Finalizing batch file upload task", {
            totalFiles: files.length,
            successfulUploads,
            failedUploads
        });

        // Final metadata update with more diagnostic information
        metadata.set("completionTimestamp", Date.now());
        metadata.set("fileCount", files.length);
        metadata.set("documentsCreated", successfulUploads);

        // Force flush metadata and wait longer to ensure all operations complete
        try {
            await metadata.flush();
            logger.info("Metadata flush completed successfully");

            // Longer wait to ensure all background processes finish
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (flushError) {
            logger.error("Critical error in final metadata flush:", {
                error: flushError instanceof Error ? flushError.message : String(flushError),
                stack: flushError instanceof Error ? flushError.stack : undefined
            });
            // Still wait even if flush fails
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const finalResult = {
            totalFiles: files.length,
            successfulUploads,
            failedUploads,
            status: "completed",
            timestamp: new Date().toISOString()
        };

        logger.info("Batch file upload task completed, returning final result", finalResult);

        // One final pause before returning to ensure logs are sent
        await new Promise(resolve => setTimeout(resolve, 500));

        return finalResult;
    },
});