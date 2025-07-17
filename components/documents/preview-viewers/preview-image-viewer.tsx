import { useState } from "react";

import { DocumentPreviewData } from "@/lib/types/document-preview";
import { cn } from "@/lib/utils";

interface PreviewImageViewerProps {
  documentData: DocumentPreviewData;
  onClose: () => void;
}

export function PreviewImageViewer({
  documentData,
  onClose,
}: PreviewImageViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const { file, documentName } = documentData;

  if (!file) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-gray-400">Image not available</p>
      </div>
    );
  }

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Document Title */}
      <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2">
        <div className="rounded-lg bg-black/20 px-3 py-2 text-white">
          <span className="text-sm font-medium">{documentName}</span>
        </div>
      </div>

      {/* Image Content */}
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="relative max-h-full max-w-full">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            </div>
          )}

          <img
            src={file}
            alt={documentName}
            className={cn(
              "max-h-[calc(100vh-120px)] max-w-full object-contain transition-opacity duration-200",
              imageLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={handleImageLoad}
            onError={() => setImageLoaded(true)}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    </div>
  );
}
