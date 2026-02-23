import { useState } from "react";
import type { CSSProperties } from "react";

import { DataroomFolder } from "@prisma/client";
import { Download, MoreVerticalIcon } from "lucide-react";
import { toast } from "sonner";

import { getFolderColorClasses, getFolderIcon } from "@/lib/constants/folder-constants";
import { cn, timeAgo } from "@/lib/utils";
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
import { useViewerSurfaceTheme } from "@/components/view/viewer/viewer-surface-theme";

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
  const { palette } = useViewerSurfaceTheme();

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
    <div
      className={cn(
        "group/row relative flex items-center justify-between rounded-lg border p-3 transition-all sm:p-4",
        "bg-[var(--viewer-panel-bg)] hover:bg-[var(--viewer-panel-bg-hover)]",
        "border-[var(--viewer-panel-border)] hover:border-[var(--viewer-panel-border-hover)]",
      )}
      style={
        {
          "--viewer-panel-bg": palette.panelBgColor,
          "--viewer-panel-bg-hover": palette.panelHoverBgColor,
          "--viewer-panel-border": palette.panelBorderColor,
          "--viewer-panel-border-hover": palette.panelBorderHoverColor,
          "--viewer-text": palette.textColor,
          "--viewer-muted-text": palette.mutedTextColor,
          "--viewer-control-bg": palette.controlBgColor,
          "--viewer-control-border": palette.controlBorderColor,
          "--viewer-control-border-strong": palette.controlBorderStrongColor,
          "--viewer-control-icon": palette.controlIconColor,
        } as CSSProperties
      }
    >
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
              className="truncate text-sm font-semibold leading-6 text-[var(--viewer-text)]"
              style={HIERARCHICAL_DISPLAY_STYLE}
            >
              {displayName}
            </h2>
          </div>
          {showLastUpdated && (
            <div
              className="mt-1 flex items-center space-x-1 text-xs leading-5 text-[var(--viewer-muted-text)]"
            >
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
                className={cn(
                  "h-8 w-8 border bg-transparent p-0",
                  "text-[var(--viewer-control-icon)] border-[var(--viewer-control-border)] hover:bg-[var(--viewer-control-bg)]",
                  "group-hover/row:text-[var(--viewer-text)] group-hover/row:border-[var(--viewer-control-border-strong)]",
                )}
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
