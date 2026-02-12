import { useState } from "react";

import { DataroomFolder } from "@prisma/client";
import { Download, MoreVerticalIcon } from "lucide-react";
import { toast } from "sonner";

import { getFolderColorClasses, getFolderIcon } from "@/lib/constants/folder-constants";
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
  showLastUpdated?: boolean;
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
  showLastUpdated = true,
}: FolderCardProps) {
  const [open, setOpen] = useState(false);

  // Get hierarchical display name
  const displayName = getHierarchicalDisplayName(
    folder.name,
    folder.hierarchicalIndex,
    dataroomIndexEnabled || false,
  );
  const openFolderDownloadModal = () => {
    if (!allowDownload) {
      toast.error("Downloading folders is not allowed.");
      return;
    }
    if (isPreview) {
      toast.error("You cannot download dataroom folders in preview mode.");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("viewer-download-modal-open", {
        detail: { folderId: folder.id, folderName: folder.name },
      }),
    );
  };

  return (
    <div className="group/row relative flex items-center justify-between rounded-lg border-0 p-3 ring-1 ring-gray-400 transition-all hover:bg-secondary hover:ring-gray-500 dark:bg-secondary dark:ring-gray-500 hover:dark:ring-gray-400 sm:p-4">
      {/* Click target - outside of text hierarchy to fix Safari truncation issue */}
      <button
        onClick={() => setFolderId(folder.id)}
        className="absolute inset-0 z-0 cursor-pointer"
        aria-hidden="true"
      />
      <div className="flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
        <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
          {(() => {
            const FolderIconComponent = getFolderIcon(folder.icon);
            const colorClasses = getFolderColorClasses(folder.color);
            return (
              <FolderIconComponent
                className={`h-8 w-8 ${colorClasses.iconClass}`}
                strokeWidth={1}
              />
            );
          })()}
        </div>

        <div className="min-w-0 flex-1 flex-col">
          <div className="flex items-center">
            <h2
              className="truncate text-sm font-semibold leading-6 text-foreground"
              style={HIERARCHICAL_DISPLAY_STYLE}
            >
              {displayName}
            </h2>
          </div>
          {showLastUpdated && (
            <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
              <p className="truncate">Updated {timeAgo(folder.updatedAt)}</p>
            </div>
          )}
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
                  openFolderDownloadModal();
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
