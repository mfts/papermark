import { useRouter } from "next/router";

import React from "react";

import { Download, MoreVerticalIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { fileIcon } from "@/lib/utils/get-file-icon";
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

import { DocumentVersion } from "../viewer/dataroom-viewer";

type DRDocument = {
  dataroomDocumentId: string;
  id: string;
  name: string;
  downloadOnly: boolean;
  versions: DocumentVersion[];
  canDownload: boolean;
  hierarchicalIndex: string | null;
};

type DocumentsCardProps = {
  document: DRDocument;
  linkId: string;
  viewId?: string;
  isPreview: boolean;
  allowDownload: boolean;
  isProcessing?: boolean;
  dataroomIndexEnabled?: boolean;
};

export default function DocumentCard({
  document,
  linkId,
  viewId,
  isPreview,
  allowDownload,
  isProcessing = false,
  dataroomIndexEnabled,
}: DocumentsCardProps) {
  const { theme, systemTheme } = useTheme();
  const canDownload = document.canDownload && allowDownload;

  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");
  const router = useRouter();

  // Get hierarchical display name
  const displayName = getHierarchicalDisplayName(
    document.name,
    document.hierarchicalIndex,
    dataroomIndexEnabled || false,
  );
  const { previewToken, domain, slug } = router.query as {
    previewToken?: string;
    domain?: string;
    slug?: string;
  };

  const handleDocumentClick = (e: React.MouseEvent) => {
    if (isProcessing) {
      e.preventDefault();
      toast.error(
        "Document is still processing. Please wait a moment and try again.",
      );
      return;
    }

    e.preventDefault();
    // Open in new tab
    if (domain && slug) {
      window.open(`/${slug}/d/${document.dataroomDocumentId}`, "_blank");
    } else {
      window.open(
        `/view/${linkId}/d/${document.dataroomDocumentId}${
          previewToken ? `?previewToken=${previewToken}&preview=1` : ""
        }`,
        "_blank",
      );
    }
  };

  const downloadDocument = async () => {
    if (isPreview) {
      toast.error("You cannot download dataroom document in preview mode.");
      return;
    }
    try {
      const response = await fetch(`/api/links/download/dataroom-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId,
          viewId,
          documentId: document.id,
        }),
      });

      if (!response.ok) {
        toast.error("Error downloading file");
        return;
      }

      // Check if the response is JSON (for direct downloads) or binary (for buffered files)
      const contentType = response.headers.get("content-type");

      // If it's a watermarked PDF, handle it with the buffer method
      if (contentType?.includes("application/pdf")) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = window.document.createElement("a");
        link.href = url;
        const disposition = response.headers.get("content-disposition");
        const filenameMatch =
          disposition && disposition.match(/filename="(.+)"/);
        link.download = filenameMatch
          ? decodeURIComponent(filenameMatch[1])
          : document.name;
        link.rel = "noopener noreferrer";
        window.document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          window.document.body.removeChild(link);
        }, 100);

        toast.success("File downloaded successfully");
        return;
      }

      // For all other files, use the iframe method
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        const downloadUrl = data.isDirectDownload
          ? data.downloadUrl
          : response.url;

        // Create a hidden iframe for download
        const iframe = window.document.createElement("iframe");
        iframe.style.display = "none";
        window.document.body.appendChild(iframe);
        iframe.src = downloadUrl;

        // Clean up the iframe after a delay
        setTimeout(() => {
          if (iframe && iframe.parentNode) {
            window.document.body.removeChild(iframe);
          }
        }, 5000);

        toast.success("Download started");
        return;
      }

      toast.error("Unexpected response format");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error downloading file");
    }
  };

  return (
    <div
      className={cn(
        "group/row relative flex items-center justify-between rounded-lg border-0 p-3 ring-1 ring-gray-200 transition-all hover:bg-secondary hover:ring-gray-300 dark:bg-secondary dark:ring-gray-700 hover:dark:ring-gray-500 sm:p-4",
        isProcessing && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="z-0 flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
        <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
          {fileIcon({
            fileType: document.versions[0].type ?? "",
            className: "h-8 w-8",
            isLight,
          })}
        </div>

        <div className="flex-col">
          <div className="flex items-center">
            <h2
              className="min-w-0 max-w-[300px] truncate text-sm font-semibold leading-6 text-foreground sm:max-w-lg"
              style={HIERARCHICAL_DISPLAY_STYLE}
            >
              <button
                onClick={handleDocumentClick}
                className="w-full truncate"
                disabled={isProcessing}
              >
                <span>{displayName}</span>
                {isProcessing && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Processing...)
                  </span>
                )}
                <span className="absolute inset-0" />
              </button>
            </h2>
          </div>
          <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
            <p className="truncate">
              Updated {timeAgo(document.versions[0].updatedAt)}
            </p>
          </div>
        </div>
      </div>
      {canDownload && !isProcessing && (
        <div className="z-10">
          <DropdownMenu>
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
                }}
              >
                <Download className="h-4 w-4" />
                Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
