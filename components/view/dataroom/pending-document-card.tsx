import { AlertCircle, FileIcon, Loader2, Upload } from "lucide-react";
import { useTheme } from "next-themes";

import { PendingUploadDocument } from "@/context/pending-uploads-context";
import { cn } from "@/lib/utils";
import { fileIcon } from "@/lib/utils/get-file-icon";

import { Progress } from "@/components/ui/progress";

type PendingDocumentCardProps = {
  pendingUpload: PendingUploadDocument;
};

export default function PendingDocumentCard({
  pendingUpload,
}: PendingDocumentCardProps) {
  const { theme, systemTheme } = useTheme();
  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");

  const getStatusText = () => {
    switch (pendingUpload.status) {
      case "uploading":
        return `Uploading... ${pendingUpload.progress}%`;
      case "processing":
        return "Processing document...";
      case "error":
        return pendingUpload.errorMessage || "Upload failed";
      case "complete":
        return "Complete";
      default:
        return "Pending";
    }
  };

  const getStatusIcon = () => {
    switch (pendingUpload.status) {
      case "uploading":
        return <Upload className="h-4 w-4 animate-pulse text-blue-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-orange-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const isError = pendingUpload.status === "error";
  const isUploading = pendingUpload.status === "uploading";
  const isProcessing = pendingUpload.status === "processing";

  return (
    <div
      className={cn(
        "group/row relative flex items-center justify-between rounded-lg border-0 p-3 ring-1 transition-all sm:p-4",
        isError
          ? "bg-red-50/50 ring-red-200 dark:bg-red-950/20 dark:ring-red-800"
          : "ring-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:ring-blue-800",
      )}
    >
      <div className="z-0 flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
        <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
          {pendingUpload.fileType ? (
            fileIcon({
              fileType: pendingUpload.fileType,
              className: "h-8 w-8 opacity-60",
              isLight,
            })
          ) : (
            <FileIcon className="h-8 w-8 text-muted-foreground opacity-60" />
          )}
        </div>

        <div className="flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 max-w-[300px] truncate text-sm font-semibold leading-6 text-foreground sm:max-w-lg">
              {pendingUpload.name}
            </h2>
            {getStatusIcon()}
          </div>
          <div className="mt-1 flex flex-col gap-1">
            <p
              className={cn(
                "text-xs leading-5",
                isError ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
              )}
            >
              {getStatusText()}
            </p>
            {(isUploading || isProcessing) && (
              <Progress
                value={isProcessing ? 100 : pendingUpload.progress}
                className={cn(
                  "h-1 w-full max-w-[200px]",
                  isProcessing && "animate-pulse",
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
