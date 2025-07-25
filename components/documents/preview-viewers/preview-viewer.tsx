import { DocumentPreviewData } from "@/lib/types/document-preview";

import { PreviewImageViewer } from "./preview-image-viewer";
import { PreviewPagesViewer } from "./preview-pages-viewer";

interface PreviewViewerProps {
  documentData: DocumentPreviewData;
  onClose: () => void;
}

export function PreviewViewer({ documentData, onClose }: PreviewViewerProps) {
  const renderViewer = () => {
    // Documents with pages (PDFs, docs, slides)
    if (documentData.pages && documentData.pages.length > 0) {
      return (
        <PreviewPagesViewer documentData={documentData} onClose={onClose} />
      );
    }

    // Single image files
    if (documentData.fileType === "image" && documentData.file) {
      return (
        <PreviewImageViewer documentData={documentData} onClose={onClose} />
      );
    }

    // Excel/CSV files
    if (documentData.fileType === "sheet" && documentData.sheetData) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400">
              Sheet preview coming soon. Please preview via a shared link.
            </p>
          </div>
        </div>
      );
    }

    // Notion documents (not fully supported yet)
    if (documentData.fileType === "notion") {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400">Notion document preview coming soon</p>
          </div>
        </div>
      );
    }

    // Fallback for unsupported types
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">
            Preview not available for this document type
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-full w-full rounded-lg bg-gray-900">
      {renderViewer()}
    </div>
  );
}
