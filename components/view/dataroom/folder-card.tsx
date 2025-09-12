import { useState } from "react";

import { DataroomFolder } from "@prisma/client";
import { Download, FolderIcon, MoreVerticalIcon } from "lucide-react";
import { toast } from "sonner";

import { timeAgo } from "@/lib/utils";
import {
  HIERARCHICAL_DISPLAY_STYLE,
  getHierarchicalDisplayName,
} from "@/lib/utils/hierarchical-display";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FolderCardProps = {
  folder: DataroomFolder;
  dataroomId: string;
  setFolderId: (id: string) => void;
  isPreview: boolean;
  linkId: string;
  viewId?: string;
  allowDownload: boolean;
  dataroomIndexEnabled?: boolean;
};
export default function FolderCard({
  folder,
  dataroomId,
  setFolderId,
  isPreview,
  linkId,
  viewId,
  allowDownload,
  dataroomIndexEnabled,
}: FolderCardProps) {
  const [open, setOpen] = useState(false);

  // Get hierarchical display name
  const displayName = getHierarchicalDisplayName(
    folder.name,
    folder.hierarchicalIndex,
    dataroomIndexEnabled || false,
  );
  const downloadDocument = async () => {
    if (!allowDownload) {
      toast.error("Downloading folders is not allowed.");
      return;
    }
    if (isPreview) {
      toast.error("You cannot download dataroom folders in preview mode.");
      return;
    }

    toast.promise(
      fetch(`/api/links/download/dataroom-folder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: folder.id,
          dataroomId,
          viewId,
          linkId,
        }),
      }),
      {
        loading: "Downloading dataroom folder...",
        success: async (response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch download URL");
          }

          const { downloadUrl } = await response.json();

          const link = document.createElement("a");
          link.href = downloadUrl;
          link.rel = "noopener noreferrer";
          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            document.body.removeChild(link);
          }, 100);

          return `${folder.name} downloaded successfully.`;
        },
        error: (error) => {
          console.error("Error downloading folder:", error);
          return error.message || "An error occurred while downloading file.";
        },
      },
    );
  };

  return (
    <div className="group/row relative flex items-center justify-between rounded-lg border-0 p-3 ring-1 ring-gray-400 transition-all hover:bg-secondary hover:ring-gray-500 dark:bg-secondary dark:ring-gray-500 hover:dark:ring-gray-400 sm:p-4">
      <div className="flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
        <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
          <FolderIcon className="h-8 w-8" strokeWidth={1} />
        </div>

        <div className="flex-col">
          <div className="flex items-center">
            <h2
              className="min-w-0 max-w-[300px] truncate text-sm font-semibold leading-6 text-foreground sm:max-w-lg"
              style={HIERARCHICAL_DISPLAY_STYLE}
            >
              <div
                onClick={() => setFolderId(folder.id)}
                className="w-full truncate"
              >
                <span>{displayName}</span>
                <span className="absolute inset-0" />
              </div>
            </h2>
          </div>
          <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
            <p className="truncate">Updated {timeAgo(folder.updatedAt)}</p>
          </div>
        </div>
      </div>
      {allowDownload ? (
        <div className="z-10">
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 text-gray-500 ring-1 ring-gray-100 hover:bg-gray-200 group-hover/row:text-foreground group-hover/row:ring-gray-300"
                aria-label="Open menu"
              >
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  downloadDocument();
                  setOpen(false);
                }}
                disabled={isPreview}
              >
                <Download className="h-4 w-4" />
                Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </div>
  );
}
