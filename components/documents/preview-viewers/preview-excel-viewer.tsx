import { useState } from "react";

import { DocumentPreviewData } from "@/lib/types/document-preview";
import { cn } from "@/lib/utils";

interface PreviewExcelViewerProps {
  documentData: DocumentPreviewData;
  onClose: () => void;
}

export function PreviewExcelViewer({
  documentData,
  onClose,
}: PreviewExcelViewerProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const { file, documentName } = documentData;

  if (!file) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-gray-400">Excel preview not available</p>
      </div>
    );
  }

  const embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file)}&wdPrint=0&action=embedview&wdAllowInteractivity=False`;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Document Title */}
      <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2">
        <div className="rounded-lg bg-black/20 px-3 py-2 text-white">
          <span className="text-sm font-medium">{documentName}</span>
        </div>
      </div>

      {/* Loading indicator */}
      {!iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}

      {/* Office Online iframe */}
      <div className="h-full w-full pt-14 pb-2 px-2">
        <iframe
          className={cn(
            "h-full w-full rounded-md transition-opacity duration-200",
            iframeLoaded ? "opacity-100" : "opacity-0",
          )}
          src={embedUrl}
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
}
