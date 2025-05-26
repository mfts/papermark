import { useEffect, useState } from "react";

import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  FileCheck,
  Folder,
  Loader,
  Maximize2,
  Minimize2Icon,
  MinusIcon,
  Search,
  UploadCloud,
  X,
} from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import {
  UploadProgress,
  UploadStatus,
} from "@/lib/hooks/use-google-drive-upload";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GoogleDriveUploadProgressProps {
  uploads: UploadProgress[];
  open: boolean;
  setOpen: (open: boolean) => void;
  setLocalUploads: (uploads: UploadProgress[]) => void;
  onMinimize?: () => void;
  canClose?: boolean;
}

type FilterTab = "all" | "active" | "completed" | "failed";

export function GoogleDriveUploadProgress({
  uploads,
  open,
  setOpen,
  setLocalUploads,
  onMinimize,
  canClose = true,
}: GoogleDriveUploadProgressProps) {
  const [isOpen, setIsOpen] = useState(open);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentUploads, setCurrentUploads] = useState(uploads);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState<FilterTab>("all");
  const [minimalView, setMinimalView] = useState(false);

  // Debounce the search term update to avoid excessive filtering
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchTerm(value);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSetSearch(value);
  };

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  useEffect(() => {
    let filteredUploads = [...uploads];

    // Apply search filter
    if (debouncedSearchTerm) {
      filteredUploads = filteredUploads.filter((upload) => {
        const fileName = upload.fileName || "";
        return fileName
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());
      });
    }

    // Apply tab filter
    switch (currentTab) {
      case "active":
        filteredUploads = filteredUploads.filter(
          (u) =>
            u.status === "uploading" ||
            u.status === "pending" ||
            u.status === "initializing" ||
            u.status === "processing",
        );
        break;
      case "completed":
        filteredUploads = filteredUploads.filter(
          (u) => u.status === "completed",
        );
        break;
      case "failed":
        filteredUploads = filteredUploads.filter((u) => u.status === "error");
        break;
      default:
        break;
    }

    setCurrentUploads(filteredUploads);
  }, [uploads, debouncedSearchTerm, currentTab]);

  const handleClose = () => {
    // Only close if allowed
    if (canClose) {
      setIsOpen(false);
      setOpen(false);
      setLocalUploads([]);
    }
  };

  if (!isOpen) return null;

  const completedCount = uploads.filter((u) => u.status === "completed").length;
  const failedCount = uploads.filter((u) => u.status === "error").length;
  const totalCount = uploads.length;
  const activeCount = uploads.filter((u) =>
    ["uploading", "pending", "initializing", "processing"].includes(u.status),
  ).length;

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getStatusText = (status: UploadStatus, progress: number) => {
    switch (status) {
      case "completed":
        return "Complete";
      case "error":
        return "Failed";
      case "uploading":
        return progress === 0 ? "Starting..." : "Uploading...";
      case "pending":
        return "Waiting...";
      case "initializing":
        return "Initializing...";
      case "processing":
        return "Processing...";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = (status: UploadStatus, progress: number) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "uploading":
        return <UploadCloud className="h-4 w-4 animate-pulse text-blue-500" />;
      case "pending":
        return <Loader className="h-4 w-4 text-gray-500" />;
      case "initializing":
        return <Loader className="h-4 w-4 animate-spin text-blue-500" />;
      case "processing":
        return <Loader className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Loader className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDocumentStatusText = (status?: string) => {
    if (!status) return "";

    switch (status) {
      case "pending":
        return "Document creation pending";
      case "in_progress":
        return "Creating document...";
      case "completed":
        return "Document created";
      case "failed":
        return "Document creation failed";
      default:
        return "";
    }
  };

  const getDocumentStatusIcon = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case "pending":
        return <Loader className="h-4 w-4 text-gray-500" />;
      case "in_progress":
        return <Loader className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <FileCheck className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getDataroomStatusText = (status?: string) => {
    if (!status) return "";

    switch (status) {
      case "pending":
        return "Dataroom add pending";
      case "in_progress":
        return "Adding to dataroom...";
      case "completed":
        return "Added to dataroom";
      case "failed":
        return "Dataroom add failed";
      default:
        return "";
    }
  };

  const getDataroomStatusIcon = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case "pending":
        return <Loader className="h-4 w-4 text-gray-500" />;
      case "in_progress":
        return <Loader className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <Folder className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: UploadStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100";
      case "error":
        return "bg-red-100";
      case "uploading":
      case "pending":
      case "initializing":
      case "processing":
        return "bg-blue-100";
      default:
        return "";
    }
  };

  const getItemBackgroundClass = (upload: UploadProgress) => {
    if (upload.status === "completed") {
      if (upload.documentCreationStatus === "completed") {
        if (upload.dataroomAddStatus === "completed") {
          return "bg-green-50 border-l-4 border-green-500";
        }
        return "bg-green-50 border-l-4 border-green-300";
      }
      return "bg-blue-50";
    }
    if (upload.status === "error") {
      return "bg-red-50";
    }
    return "";
  };

  const getBadgeVariant = (
    tab: FilterTab,
    current: FilterTab,
  ): "default" | "secondary" | "outline" | "destructive" | "success" => {
    // If this is the current tab, use a special style
    if (tab === current) {
      // Return appropriate variant based on tab name
      switch (tab) {
        case "all":
          return "default";
        case "active":
          return "secondary";
        case "completed":
          return "success";
        case "failed":
          return "destructive";
        default:
          return "default";
      }
    }
    // For non-selected tabs, use outline
    return "outline";
  };

  const handleViewDocument = (documentId: string) => {
    // Implement document viewing functionality here
    // This could open a new window or navigate to a document page
    window.open(`/documents/${documentId}`, "_blank");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-[400px] rounded-lg border border-gray-200 bg-white shadow-lg">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium">Upload Progress</h3>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {activeCount} active
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setMinimalView(!minimalView)}
                    >
                      {minimalView ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2Icon className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{minimalView ? "Detailed view" : "Compact view"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {onMinimize && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onMinimize}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Minimize</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleClose}
                      disabled={!canClose}
                    >
                      <X
                        className={`h-4 w-4 ${!canClose ? "text-gray-300" : ""}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{canClose ? "Close" : "Cannot close while uploading"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className="border-b border-gray-200 p-4">
              <div className="flex flex-col space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1.5 h-6 w-6"
                      onClick={() => handleSearchChange("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={getBadgeVariant("all", currentTab)}
                    onClick={() => setCurrentTab("all")}
                    className="cursor-pointer"
                  >
                    All ({totalCount})
                  </Badge>
                  <Badge
                    variant={getBadgeVariant("active", currentTab)}
                    onClick={() => setCurrentTab("active")}
                    className="cursor-pointer"
                  >
                    Active ({activeCount})
                  </Badge>
                  <Badge
                    variant={getBadgeVariant("completed", currentTab)}
                    onClick={() => setCurrentTab("completed")}
                    className="cursor-pointer"
                  >
                    Completed ({completedCount})
                  </Badge>
                  <Badge
                    variant={getBadgeVariant("failed", currentTab)}
                    onClick={() => setCurrentTab("failed")}
                    className="cursor-pointer"
                  >
                    Failed ({failedCount})
                  </Badge>
                </div>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {currentUploads.length > 0 ? (
                currentUploads.map((upload) => (
                  <div
                    key={upload.fileId}
                    className={cn(
                      "border-b border-gray-200 p-4 transition-colors last:border-b-0",
                      getItemBackgroundClass(upload),
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(upload.status, upload.progress)}
                          <p className="truncate text-sm font-medium">
                            {upload.fileName || "Untitled file"}
                            {upload.bytesTotal && !minimalView && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({formatFileSize(upload.bytesTotal)})
                              </span>
                            )}
                          </p>
                        </div>

                        {!minimalView && (
                          <p className="mt-1 text-xs text-gray-500">
                            {getStatusText(upload.status, upload.progress)}
                            {upload.bytesUploaded && upload.bytesTotal && (
                              <span className="ml-2">
                                {formatFileSize(upload.bytesUploaded)} /{" "}
                                {formatFileSize(upload.bytesTotal)}
                              </span>
                            )}
                          </p>
                        )}

                        {/* Document creation status */}
                        {upload.status === "completed" &&
                          upload.documentCreationStatus &&
                          !minimalView && (
                            <div className="mt-1 flex items-center">
                              {getDocumentStatusIcon(
                                upload.documentCreationStatus,
                              )}
                              <p
                                className={cn(
                                  "ml-1 text-xs",
                                  upload.documentCreationStatus === "failed"
                                    ? "text-red-500"
                                    : "text-gray-500",
                                )}
                              >
                                {getDocumentStatusText(
                                  upload.documentCreationStatus,
                                )}
                              </p>
                            </div>
                          )}

                        {/* Dataroom addition status */}
                        {upload.status === "completed" &&
                          upload.documentCreationStatus === "completed" &&
                          upload.dataroomAddStatus &&
                          !minimalView && (
                            <div className="mt-1 flex items-center">
                              {getDataroomStatusIcon(upload.dataroomAddStatus)}
                              <p
                                className={cn(
                                  "ml-1 text-xs",
                                  upload.dataroomAddStatus === "failed"
                                    ? "text-red-500"
                                    : "text-gray-500",
                                )}
                              >
                                {getDataroomStatusText(
                                  upload.dataroomAddStatus,
                                )}
                              </p>
                            </div>
                          )}
                      </div>

                      {upload.status === "completed" &&
                      upload.documentCreationStatus === "completed" &&
                      upload.documentId ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() =>
                                  handleViewDocument(upload.documentId!)
                                }
                              >
                                <Eye className="h-4 w-4 text-blue-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View document</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="ml-2 text-sm text-gray-500">
                          {Number.isFinite(upload.progress)
                            ? `${upload.progress.toFixed(0)}%`
                            : "--"}
                        </span>
                      )}
                    </div>
                    <Progress
                      value={upload.progress}
                      className={cn("h-1", getStatusColor(upload.status))}
                    />
                    {upload.error && !minimalView && (
                      <p className="mt-1 text-xs text-red-500">
                        {upload.error}
                      </p>
                    )}
                    {upload.documentCreationError && !minimalView && (
                      <p className="mt-1 text-xs text-red-500">
                        Document error: {upload.documentCreationError}
                      </p>
                    )}
                    {upload.dataroomAddError && !minimalView && (
                      <p className="mt-1 text-xs text-red-500">
                        Dataroom error: {upload.dataroomAddError}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex h-20 items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    {debouncedSearchTerm
                      ? "No matching uploads found"
                      : `No ${currentTab === "all" ? "" : currentTab} uploads`}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{completedCount} completed</span>
              <span>{failedCount} failed</span>
            </div>
            <Progress
              value={totalCount > 0 ? (completedCount / totalCount) * 100 : 0}
              className="h-1 w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
