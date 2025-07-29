import { useCallback, useEffect, useRef, useState } from "react";

import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { ExportJob } from "@/lib/redis-job-store";

import { Button } from "../ui/button";

interface ExportStatus {
  status: string;
  progress?: string;
  exportId?: string;
  startTime?: number;
}

interface ExportVisitsModalProps {
  teamId: string;
  dataroomId: string;
  dataroomName: string;
  groupId?: string;
  groupName?: string;
  onClose: () => void;
}

export function ExportVisitsModal({
  teamId,
  dataroomId,
  dataroomName,
  groupId,
  groupName,
  onClose,
}: ExportVisitsModalProps) {
  const { data: session } = useSession();
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [existingExports, setExistingExports] = useState<ExportJob[]>([]);
  const [showNewExport, setShowNewExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const exportStartedRef = useRef<boolean>(false);

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Fetch existing exports when modal opens
  useEffect(() => {
    const fetchExistingExports = async () => {
      try {
        setLoading(true);
        setShowModal(true);

        const endpoint = groupId
          ? `/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}/export-visits`
          : `/api/teams/${teamId}/datarooms/${dataroomId}/export-visits`;

        const response = await fetch(endpoint, { method: "GET" });

        if (response.ok) {
          const exports = await response.json();
          setExistingExports(exports);
        } else {
          console.error("Failed to fetch existing exports");
        }
      } catch (error) {
        console.error("Error fetching existing exports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingExports();
  }, [teamId, dataroomId, groupId]);

  const startNewExport = useCallback(async () => {
    // Prevent double triggering
    if (exportStartedRef.current) {
      console.warn("Export already started, skipping duplicate request");
      return;
    }
    exportStartedRef.current = true;
    setShowNewExport(true);

    try {
      // Get view count first
      try {
        const viewCountResponse = await fetch(
          `/api/teams/${teamId}/datarooms/${dataroomId}/views-count${groupId ? `?groupId=${groupId}` : ""}`,
          { method: "GET" },
        );

        if (viewCountResponse.ok) {
          const viewData = await viewCountResponse.json();
          setViewCount(viewData.count || 0);
        }
      } catch (error) {
        console.error("Error fetching view count:", error);
        // Continue with export even if view count fails
      }

      // Trigger the background export job
      const endpoint = groupId
        ? `/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}/export-visits`
        : `/api/teams/${teamId}/datarooms/${dataroomId}/export-visits`;

      const response = await fetch(endpoint, { method: "POST" });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.exportId) {
        const startTime = Date.now();
        setExportStatus({
          status: "PROCESSING",
          exportId: data.exportId,
          startTime,
        });

        // Clear any existing interval
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }

        // Start polling
        pollIntervalRef.current = setInterval(async () => {
          try {
            const statusResponse = await fetch(
              `/api/teams/${teamId}/export-jobs/${data.exportId}`,
              { method: "GET" },
            );

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();

              // Update progress
              setExportStatus((prev) => ({
                ...prev!,
                progress: "Preparing export...",
              }));

              if (statusData.status === "COMPLETED" && statusData.isReady) {
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                }

                // Create a direct link to the API endpoint (it will redirect to blob)
                const downloadUrl = `/api/teams/${teamId}/export-jobs/${data.exportId}?download=true`;
                try {
                  const link = window.document.createElement("a");
                  link.href = downloadUrl;
                  link.setAttribute(
                    "download",
                    `${statusData.resourceName || dataroomName}_${groupName ? `${groupName}_` : ""}visits_${new Date().toISOString().split("T")[0]}.csv`,
                  );
                  link.rel = "noopener noreferrer";
                  link.style.display = "none";

                  window.document.body.appendChild(link);
                  link.click();
                  window.document.body.removeChild(link);
                } catch (error) {
                  // Fallback: open in new tab if programmatic download fails
                  window.open(downloadUrl, "_blank");
                  console.error("Download failed, opened in new tab:", error);
                }

                handleClose();
                toast.success("Export successfully downloaded");
              } else if (statusData.status === "FAILED") {
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                }
                handleClose();
                toast.error(
                  `Export failed: ${statusData.error || "Unknown error"}`,
                );
              }
            }
          } catch (error) {
            console.error("Error polling export status:", error);
          }
        }, 5000); // Poll every 5 seconds

        // Clear interval after 10 minutes to prevent indefinite polling
        setTimeout(() => {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          handleClose();
        }, 600000);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        "An error occurred while starting the export. Please try again.",
      );
      handleClose();
    }
  }, [teamId, dataroomId, groupId, dataroomName, groupName]);

  // Send export via email
  const sendExportEmail = async () => {
    if (!exportStatus?.exportId || !session?.user?.email) return;

    try {
      const response = await fetch(
        `/api/teams/${teamId}/export-jobs/${exportStatus.exportId}/send-email`,
        { method: "POST" },
      );

      if (response.ok) {
        toast.success("Export will be sent to your email when ready");
        handleClose();
      } else {
        toast.error("Failed to setup email notification");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to setup email notification");
    }
  };

  // Cancel export
  const cancelExport = async () => {
    if (!exportStatus?.exportId) return;

    try {
      const response = await fetch(
        `/api/teams/${teamId}/export-jobs/${exportStatus.exportId}`,
        { method: "PATCH" },
      );

      if (response.ok) {
        toast.success("Export cancelled successfully");
        handleClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to cancel export");
      }
    } catch (error) {
      console.error("Error cancelling export:", error);
      toast.error("Failed to cancel export");
    }
  };

  // Download existing export
  const downloadExport = async (exportId: string, resourceName: string) => {
    try {
      const downloadUrl = `/api/teams/${teamId}/export-jobs/${exportId}?download=true`;
      const link = window.document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute(
        "download",
        `${resourceName || dataroomName}_${groupName ? `${groupName}_` : ""}visits_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.rel = "noopener noreferrer";
      link.style.display = "none";

      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download export");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Handle close - cleanup and call parent onClose
  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setShowModal(false);
    setExportStatus(null);
    setShowNewExport(false);
    setExistingExports([]); // Reset existing exports
    setViewCount(null); // Reset view count
    setLoading(true); // Reset loading state
    exportStartedRef.current = false; // Reset for potential reuse
    onClose();
  };

  // Don't render anything if not visible and no modal to show
  if (!showModal) {
    return null;
  }

  const displayName = groupName
    ? `${dataroomName} - ${groupName}`
    : dataroomName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Export Visits</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : showNewExport ? (
          // Show export progress
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-muted-foreground"></div>
              <span className="text-sm text-gray-600">
                {exportStatus?.progress || "Processing export..."}
              </span>
            </div>

            <div className="text-sm text-gray-600">
              Exporting visits for: {displayName}
            </div>

            {viewCount !== null && (
              <div className="text-sm text-gray-600">
                Found {viewCount} visit{viewCount !== 1 ? "s" : ""} to export
              </div>
            )}

            {viewCount !== null && viewCount > 10 && session?.user?.email && (
              <div className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900">
                <p className="mb-2 font-medium text-muted-foreground">
                  Large export detected ({viewCount} visits)
                </p>
                <p className="mb-3 text-muted-foreground">
                  This export may take several minutes. We recommend getting it
                  emailed to you when ready.
                </p>
                <button
                  onClick={sendExportEmail}
                  className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  Email to {session.user.email}
                </button>
              </div>
            )}

            {(!viewCount || viewCount <= 10) && (
              <div className="text-sm text-gray-500">
                Your export will be ready shortly...
              </div>
            )}

            {/* Cancel button - only show if export is in progress */}
            {exportStatus?.exportId && (
              <div className="flex gap-2 px-3">
                <Button
                  onClick={cancelExport}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-md border border-red-300 bg-white px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-red-600 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Cancel Export
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Show existing exports and new export option
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Exports for: {displayName}
            </div>

            {existingExports.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Recent Exports
                </h4>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {existingExports.map((exportJob) => (
                    <div
                      key={exportJob.id}
                      className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(exportJob.status)}`}
                          >
                            {exportJob.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(exportJob.createdAt)}
                          </span>
                        </div>
                        {exportJob.groupId && (
                          <div className="mt-1 text-xs text-gray-500">
                            Group: {exportJob.groupId}
                          </div>
                        )}
                        {exportJob.error && (
                          <p className="mt-1 text-xs text-red-600">
                            {exportJob.error}
                          </p>
                        )}
                      </div>
                      {exportJob.status === "COMPLETED" && exportJob.result && (
                        <button
                          onClick={() =>
                            downloadExport(
                              exportJob.id,
                              exportJob.resourceName || dataroomName,
                            )
                          }
                          className="ml-2 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground transition-colors hover:bg-primary/80"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500">
                No previous exports found
              </div>
            )}

            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                onClick={startNewExport}
                className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Start New Export
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
