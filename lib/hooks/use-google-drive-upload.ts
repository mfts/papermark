import { Files, ProcessedFile } from "@/components/documents/add-document-modal";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { mutate } from "swr";
import { useTeam } from "@/context/team-context";
import { useRouter } from "next/router";

const TERMINAL_STATES = ["COMPLETED", "FAILED", "CRASHED", "CANCELED", "SYSTEM_FAILURE"];

const mapStatusFromServer = (serverStatus: string): UploadStatus => {
    switch (serverStatus) {
        case "pending": return "pending";
        case "initializing": return "initializing";
        case "processing": return "uploading";
        case "completed": return "completed";
        case "failed": return "error";
        default: return "unknown";
    }
};

const mapDocStatusFromServer = (status: string | undefined): DocumentCreationStatus | undefined => {
    if (!status) return undefined;
    switch (status) {
        case "pending": return "pending";
        case "in_progress": return "in_progress";
        case "completed": return "completed";
        case "failed": return "failed";
        default: return "pending";
    }
};

export type UploadStatus =
    | "pending"       // Waiting to start
    | "initializing"  // Starting the upload process
    | "uploading"     // Actually uploading data
    | "processing"    // Server processing after upload
    | "completed"     // Successfully completed
    | "failed"        // Failed with error
    | "error"         // Failed with error
    | "unknown";      // Status can't be determined

export type DocumentCreationStatus =
    | "pending"       // Waiting to start
    | "in_progress"   // Starting the upload process
    | "completed"     // Successfully completed
    | "failed";       // Failed with error

export type UploadProgress = {
    fileId: string;
    fileName?: string;
    progress: number;
    status: UploadStatus;
    error?: string;
    uploadId?: string;
    timestamp: number;
    bytesUploaded?: number;
    bytesTotal?: number;
    documentCreated?: boolean;
    documentCreationStatus?: DocumentCreationStatus;
    documentCreationError?: string;
    documentId?: string;
    dataroomAddStatus?: DocumentCreationStatus;
    dataroomAddError?: string;
};

export function useGoogleDriveUpload() {
    const teamInfo = useTeam();
    const router = useRouter();
    const { name, id: dataroomId } = router.query as { name?: string[], id?: string };
    const folderPathName = name?.join("/");
    const [uploads, setUploads] = useState<UploadProgress[]>([]);
    const [activeUploads, setActiveUploads] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const lastMetadataUpdate = useRef<number>(0);
    const mutateTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const toastShown = useRef<{ [key: string]: boolean }>({});
    const uploadInProgress = useRef<boolean>(false);

    useEffect(() => {
        if (jobId || accessToken) return;

        const fetchExistingSession = async () => {
            try {
                const response = await fetch('/api/integrations/google-drive/upload-session');

                if (response.ok) {
                    const data = await response.json();
                    if (data.hasActiveSession && data.jobId && data.accessToken) {
                        setJobId(data.jobId);
                        setAccessToken(data.accessToken);
                        setIsUploading(true);
                        uploadInProgress.current = true;
                    }
                }
            } catch (error) {
                console.error("Error fetching existing upload session", error);
            }
        };

        fetchExistingSession();

        return () => {
            mutateTimeoutRefs.current.forEach((timeout) => {
                clearTimeout(timeout);
            });
            mutateTimeoutRefs.current.clear();
        };
    }, [jobId, accessToken]);

    const { run, error: runError, stop } = useRealtimeRun(jobId ?? "", {
        enabled: !!jobId && !!accessToken,
        accessToken: accessToken ?? undefined,
    });

    // Function to handle server-side cleanup only (API session)
    const cleanupServerSession = useCallback((jobIdToCleanup: string) => {
        // Don't do anything if there's no job ID
        if (!jobIdToCleanup) return;

        // Clear session using API
        return fetch('/api/integrations/google-drive/upload-session', {
            method: 'DELETE',
        }).catch((error) => {
            console.error("Error cleaning up server session", error);
        });
    }, []);

    // Function to clean up job ID and reset state
    const cleanupJobId = useCallback((jobIdToCleanup: string) => {
        if (!jobIdToCleanup) return;
        if (jobIdToCleanup === jobId) {
            stop();
        }

        // Clean up the server session first
        cleanupServerSession(jobIdToCleanup);

        // Reset the job tracking state only
        setJobId(null);
        setAccessToken(null);
        setIsUploading(false);
        uploadInProgress.current = false;
    }, [cleanupServerSession, jobId, stop]);

    // Debounced mutate function to prevent excessive API calls
    const debouncedMutate = useCallback((key: string) => {
        const existingTimeout = mutateTimeoutRefs.current.get(key);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        const newTimeout = setTimeout(() => {
            mutate(key).catch((error) => {
                console.error("Error mutating data", error);
            });
            mutateTimeoutRefs.current.delete(key);
        }, 300);
        mutateTimeoutRefs.current.set(key, newTimeout);
    }, []);



    // Helper to perform document-related mutations
    const mutateDocuments = useCallback(() => {
        if (!teamInfo?.currentTeam?.id) return;
        // TODO: :ALERT:ALERT:ALERT: NEED TO CHECK ONES AGAIN
        const key = dataroomId
            ? `/api/teams/${teamInfo.currentTeam.id}/datarooms/${dataroomId}${folderPathName ? `/folders/documents/${folderPathName}` : "/documents"}`
            : `/api/teams/${teamInfo.currentTeam.id}/${folderPathName ? `folders/documents/${folderPathName}` : "documents"}`;

        debouncedMutate(key);
    }, [teamInfo?.currentTeam?.id, dataroomId, folderPathName, debouncedMutate]);

    // Helper to perform folder-related mutations
    const mutateFolders = useCallback(() => {
        if (!teamInfo?.currentTeam?.id) return;
        // TODO: :ALERT:ALERT:ALERT: NEED TO CHECK ONES AGAIN
        const key = dataroomId
            ? `/api/teams/${teamInfo.currentTeam.id}/datarooms/${dataroomId}${folderPathName ? `/folders/${folderPathName}` : "/folders?root=true"}`
            : `/api/teams/${teamInfo.currentTeam.id}${folderPathName ? `/folders/${folderPathName}` : "/folders?root=true"}`;

        debouncedMutate(key);
    }, [teamInfo?.currentTeam?.id, dataroomId, folderPathName, debouncedMutate]);

    // Effect to handle terminal states
    useEffect(() => {
        if (!run || run.id !== jobId || !jobId) return;

        // Check if the run is in a terminal state
        const metadata = run.metadata || {};
        const isTerminalState = run.status === "COMPLETED" || metadata.status === "completed" ||
            TERMINAL_STATES.includes(run.status) || metadata.status === "failed";

        // Only show notifications when status changes to a terminal state
        const isCompleted = run.status === "COMPLETED" || metadata.status === "completed";
        const isFailed = !isCompleted && isTerminalState;

        // Only show toast once per job ID
        const toastKey = `${jobId}-${isCompleted ? 'completed' : 'failed'}`;

        if (isCompleted && !toastShown.current[toastKey]) {
            toastShown.current[toastKey] = true;
            const failedUploads = typeof metadata.failedUploads === 'number' ? metadata.failedUploads : 0;

            if (failedUploads > 0) {
                toast.warning(`Upload completed with ${failedUploads} errors.`);
            } else {
                toast.success("All uploads completed successfully");
            }
        } else if (isFailed && !toastShown.current[toastKey]) {
            toastShown.current[toastKey] = true;
            toast.error(run.error?.message || "Upload failed");
        }

        // If run is in terminal state, handle cleanup after a delay
        let cleanupTimeout: NodeJS.Timeout | null = null;
        if (isTerminalState && jobId) {
            stop();

            // Set a timeout to allow UI to update before cleaning up
            cleanupTimeout = setTimeout(() => {
                cleanupJobId(jobId);
                setIsUploading(false);
                uploadInProgress.current = false;
                setActiveUploads(0);
            }, 2000);
        }

        return () => {
            if (cleanupTimeout) {
                clearTimeout(cleanupTimeout);
            }
        };
    }, [run, jobId, cleanupJobId, stop]);

    // Effect to handle run metadata updates
    useEffect(() => {
        if (!run || run.id !== jobId || !jobId) return;

        const metadata = run.metadata || {};

        // Throttle metadata processing to avoid excessive updates
        const now = Date.now();
        if (now - lastMetadataUpdate.current < 200 && run.status !== "COMPLETED") {
            return;
        }
        lastMetadataUpdate.current = now;

        // Update folder structure if folders were created
        if (metadata.isFolderStructureCreated) {
            mutateFolders();
        }

        // Update documents if any were uploaded successfully
        if (metadata.successfulUploads) {
            mutateDocuments();
        }

        // Process file progress updates from metadata
        if (metadata.fileProgress) {
            const fileProgress = metadata.fileProgress as Record<string, {
                progress: number;
                status: string;
                error?: string;
                fileName?: string;
                bytesUploaded?: number;
                bytesTotal?: number;
                documentCreated?: boolean;
                documentCreationStatus?: string;
                documentCreationError?: string;
                documentId?: string;
                dataroomAddStatus?: string;
                dataroomAddError?: string;
            }>;

            // If we don't have any uploads yet (e.g., after a refresh), initialize them
            if (uploads.length === 0 && Object.keys(fileProgress).length > 0) {
                // Create initial uploads from fileProgress
                const initialUploads: UploadProgress[] = Object.entries(fileProgress).map(([fileId, progress]) => ({
                    fileId,
                    fileName: progress.fileName,
                    progress: Number(progress.progress) || 0,
                    status: mapStatusFromServer(progress.status),
                    error: progress.error,
                    timestamp: Date.now(),
                    bytesUploaded: progress.bytesUploaded,
                    bytesTotal: progress.bytesTotal,
                    documentCreated: progress.documentCreated,
                    documentCreationStatus: mapDocStatusFromServer(progress.documentCreationStatus),
                    documentCreationError: progress.documentCreationError,
                    documentId: progress.documentId,
                    dataroomAddStatus: mapDocStatusFromServer(progress.dataroomAddStatus),
                    dataroomAddError: progress.dataroomAddError
                }));
                setUploads(initialUploads);
            }
            else {
                // Update existing uploads based on server state
                setUploads(prevUploads =>
                    prevUploads.map(upload => {
                        const progress = fileProgress[upload.fileId];
                        if (progress) {
                            // More aggressive check for stuck status:
                            // Consider any completed upload that's been sitting for more than 10 seconds
                            // with in_progress document creation as "stuck"
                            // WILL WORK FINE: JUST FOR SAFETY
                            // TODO: :ALERT:ALERT:ALERT: NEED TO CHECK ONES AGAIN
                            const isStuckDocumentCreation =
                                (progress.status === "completed" &&
                                    progress.documentCreationStatus === "in_progress" &&
                                    (Date.now() - upload.timestamp > 30000)) // 30 second timeout
                                || (metadata.status === "completed" && progress.documentCreationStatus === "in_progress");

                            // Auto-fix stuck document creation statuses
                            const documentCreationStatus = isStuckDocumentCreation
                                ? "completed"
                                : mapDocStatusFromServer(progress.documentCreationStatus);

                            return {
                                ...upload,
                                fileName: progress.fileName || upload.fileName,
                                progress: Number(progress.progress) || upload.progress,
                                status: mapStatusFromServer(progress.status),
                                error: progress.error,
                                bytesUploaded: progress.bytesUploaded,
                                bytesTotal: progress.bytesTotal,
                                documentCreated: isStuckDocumentCreation ? true : progress.documentCreated,
                                documentCreationStatus,
                                documentCreationError: progress.documentCreationError,
                                documentId: progress.documentId,
                                dataroomAddStatus: mapDocStatusFromServer(progress.dataroomAddStatus),
                                dataroomAddError: progress.dataroomAddError
                            };
                        }
                        return upload;
                    })
                );
            }
        }

        // Update active uploads count based on run status
        const isCompleted = run.status === "COMPLETED" || metadata.status === "completed";
        const isFailed = !isCompleted && (TERMINAL_STATES.includes(run.status) || metadata.status === "failed");

        if (isCompleted || isFailed) {
            // Fix any lingering "in_progress" states when job is marked as complete
            if (isCompleted) {
                setUploads(prevUploads =>
                    prevUploads.map(upload => {
                        if (upload.documentCreationStatus === "in_progress" || upload.documentCreationStatus === "pending") {
                            return {
                                ...upload,
                                documentCreationStatus: "completed",
                                documentCreated: true
                            };
                        }
                        return upload;
                    })
                );
            }

            // Refresh documents UI when upload job completes or fails
            mutateDocuments();
            setActiveUploads(0);
            setIsUploading(false);

            // Update any uploads that are still pending or uploading to error state if failed
            if (isFailed) {
                setUploads(prevUploads =>
                    prevUploads.map(upload => {
                        if (upload.status !== "completed" && upload.status !== "error") {
                            return {
                                ...upload,
                                status: "error",
                                error: "Upload process terminated unexpectedly"
                            };
                        }
                        return upload;
                    })
                );
            }
        } else {
            setActiveUploads(Number(metadata.totalFiles) || 1);
            setIsUploading(true);
            uploadInProgress.current = true;
        }

    }, [run, uploads.length, mutateFolders, mutateDocuments]);

    // Handle run errors
    useEffect(() => {
        if (runError && jobId) {
            const errorKey = `error-${jobId}`;
            if (!toastShown.current[errorKey]) {
                toastShown.current[errorKey] = true;
                toast.error("Error tracking upload progress");
            }
            stop();

            // Mark all uploads as failed if there's a run error
            setUploads(prevUploads =>
                prevUploads.map(upload => {
                    if (upload.status !== "completed") {
                        return {
                            ...upload,
                            status: "error",
                            error: runError.message || "Connection error while tracking uploads"
                        };
                    }
                    return upload;
                })
            );
        }
    }, [runError, jobId, stop]);

    // Function to start an upload
    const startUpload = useCallback(async (params: {
        treeFiles: ProcessedFile;
        path?: string;
        dataroomId?: string;
        filesList: Files[];
        teamId: string;
    }) => {
        const { treeFiles, filesList, path, dataroomId, teamId } = params;

        if (isUploading || uploadInProgress.current) {
            toast.error("An upload is already in progress");
            return () => { };
        }

        if (!filesList.length) {
            toast.error("No files selected");
            return () => { };
        }

        if (!teamId) {
            toast.error("No team ID provided");
            return () => { };
        }

        // Reset toast tracking for new uploads
        toastShown.current = {};

        // Clean up any previous uploads first - but only server session
        if (jobId) {
            await cleanupServerSession(jobId);
            setJobId(null);
            setAccessToken(null);
        }

        // Initialize new upload state
        setIsUploading(true);
        uploadInProgress.current = true;
        setActiveUploads(filesList.length);

        // Set initial upload state for each file
        setUploads(filesList.map(file => ({
            fileId: file.fileId,
            fileName: file.fileName,
            progress: 0,
            status: "pending" as const,
            timestamp: Date.now()
        })));

        try {
            const response = await fetch('/api/integrations/google-drive/batch-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    treeFiles,
                    filesList,
                    path,
                    dataroomId,
                    teamId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
                throw new Error(errorData.error || 'Failed to start upload');
            }

            const result = await response.json();

            if (!result.handle) {
                throw new Error('No handle returned from server');
            }

            // Store the handle ID and token for progress tracking
            setJobId(result.handle.id);
            setAccessToken(result.handle.publicAccessToken);

            return () => {
                setIsUploading(false);
                uploadInProgress.current = false;
                setActiveUploads(0);
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to upload files";

            // Only show toast once
            if (!toastShown.current['upload-error']) {
                toastShown.current['upload-error'] = true;
                toast.error(errorMessage);
            }

            // Update all uploads to error state
            setUploads(prevUploads =>
                prevUploads.map(upload => ({
                    ...upload,
                    status: "error" as const,
                    error: errorMessage
                }))
            );

            setIsUploading(false);
            uploadInProgress.current = false;
            setActiveUploads(0);
            return () => { };
        }
    }, [isUploading, jobId, cleanupServerSession]);

    return {
        uploads,
        isUploading,
        startUpload,
        cleanupJobId,
        activeUploads
    };
} 