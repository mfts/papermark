import { useRouter } from "next/router";

import React from "react";

import { ArrowDownToLineIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { fileIcon } from "@/lib/utils/get-file-icon";

import { DocumentVersion } from "../DataroomViewer";

type DRDocument = {
  dataroomDocumentId: string;
  id: string;
  name: string;
  downloadOnly: boolean;
  versions: DocumentVersion[];
  canDownload: boolean;
};

type DocumentsCardProps = {
  document: DRDocument;
  linkId: string;
  viewId?: string;
  isPreview: boolean;
  allowDownload: boolean;
};

export default function DocumentCard({
  document,
  linkId,
  viewId,
  isPreview,
  allowDownload,
}: DocumentsCardProps) {
  const { theme, systemTheme } = useTheme();
  const canDownload = document.canDownload && allowDownload;

  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");
  const router = useRouter();
  const { previewToken, domain, slug } = router.query as {
    previewToken?: string;
    domain?: string;
    slug?: string;
  };

  const handleDocumentClick = (e: React.MouseEvent) => {
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
      const response = await fetch(`/api/links/download/dataroomDocumet`, {
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
      const { downloadUrl } = await response.json();

      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  return (
    <>
      <li className="group/row relative flex items-center justify-between rounded-lg border-0 p-3 ring-1 ring-gray-200 transition-all hover:bg-secondary hover:ring-gray-300 dark:bg-secondary dark:ring-gray-700 hover:dark:ring-gray-500 sm:p-4">
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
              <h2 className="min-w-0 max-w-[300px] truncate text-sm font-semibold leading-6 text-foreground sm:max-w-lg">
                <button
                  onClick={handleDocumentClick}
                  className="w-full truncate"
                >
                  <span>{document.name}</span>
                  <span className="absolute inset-0" />
                </button>
              </h2>
            </div>
          </div>
        </div>
        {canDownload && (
          <div className="invisible z-10 group-hover/row:visible">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                downloadDocument();
              }}
              variant="default"
              className="rounded-md p-2"
              aria-label="Download document"
            >
              <ArrowDownToLineIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
      </li>
    </>
  );
}
