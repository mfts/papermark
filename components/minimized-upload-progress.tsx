import {
  AlertCircle,
  Check,
  Loader,
  MaximizeIcon,
  UploadCloud,
  X,
} from "lucide-react";

import { UploadProgress } from "@/lib/hooks/use-google-drive-upload";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MinimizedUploadProgressProps {
  uploads: UploadProgress[];
  onMaximize: () => void;
  onClose: () => void;
  canClose?: boolean;
}

export function MinimizedUploadProgress({
  uploads,
  onMaximize,
  onClose,
  canClose = true,
}: MinimizedUploadProgressProps) {
  const totalCount = uploads.length;
  const completedCount = uploads.filter((u) => u.status === "completed").length;
  const failedCount = uploads.filter((u) => u.status === "error").length;
  const activeCount = uploads.filter((u) =>
    ["uploading", "pending", "initializing", "processing"].includes(u.status),
  ).length;

  // Get the most recent active upload for display in minimized view
  const latestActiveUpload = uploads.find((u) =>
    ["uploading", "pending", "initializing", "processing"].includes(u.status),
  );

  // Calculate average progress across all uploads
  const averageProgress =
    uploads.length > 0
      ? uploads.reduce((sum, upload) => sum + upload.progress, 0) /
        uploads.length
      : 0;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="w-[400px] rounded-lg border border-gray-200 bg-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium">Uploading Files</h3>
                {activeCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                    {activeCount} active
                  </span>
                )}
              </div>

              {latestActiveUpload && (
                <p className="mt-1 max-w-[160px] truncate text-xs text-gray-500">
                  {latestActiveUpload.fileName || "Uploading..."}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onMaximize}
                  >
                    <MaximizeIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximize</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onClose}
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
        <div className="px-4 py-2">
          <Progress value={averageProgress} className="h-2" />
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
          <div className="flex space-x-3">
            <div className="flex items-center">
              <Check className="mr-1 h-3 w-3 text-green-500" />
              <span>{completedCount}</span>
            </div>
            {failedCount > 0 && (
              <div className="flex items-center">
                <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
                <span>{failedCount}</span>
              </div>
            )}
            {activeCount > 0 && (
              <div className="flex items-center">
                <Loader className="mr-1 h-3 w-3 animate-spin text-blue-500" />
                <span>{activeCount}</span>
              </div>
            )}
          </div>
          <div>
            {completedCount}/{totalCount} files
          </div>
        </div>
      </div>
    </div>
  );
}
