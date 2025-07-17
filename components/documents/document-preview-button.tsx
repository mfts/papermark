import { useState } from "react";

import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonTooltip } from "@/components/ui/tooltip";

import { DocumentPreviewModal } from "./document-preview-modal";

interface DocumentPreviewButtonProps {
  documentId: string;
  primaryVersion?: {
    hasPages?: boolean;
    type?: string | null;
    numPages?: number | null;
  };
  isProcessing?: boolean;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "lg" | "icon";
  children?: React.ReactNode;
  className?: string;
  showTooltip?: boolean;
}

export function DocumentPreviewButton({
  documentId,
  primaryVersion,
  isProcessing = false,
  variant = "ghost",
  size = "icon",
  children,
  className,
  showTooltip = true,
}: DocumentPreviewButtonProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Check if document type supports preview
  const supportsPreview = () => {
    if (!primaryVersion) return false;

    // Support documents with pages (PDFs, docs, slides, etc.)
    if (primaryVersion.hasPages) return true;

    // Support image documents
    if (primaryVersion.type === "image") return true;

    // Don't support sheets, notion, videos, etc.
    return false;
  };

  // Don't render if document type doesn't support preview
  if (!supportsPreview()) {
    return null;
  }

  const handlePreviewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (isProcessing) return;
    setIsPreviewOpen(true);
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={handlePreviewClick}
      disabled={isProcessing}
      className={className}
    >
      {children || (
        <>
          <EyeIcon className="h-4 w-4" />
          {size !== "icon" && <span className="ml-1">Preview</span>}
        </>
      )}
    </Button>
  );

  const wrappedButton = showTooltip ? (
    <ButtonTooltip
      content={
        isProcessing
          ? "Document is still processing"
          : "Quick preview of document"
      }
    >
      {button}
    </ButtonTooltip>
  ) : (
    button
  );

  return (
    <>
      {wrappedButton}
      <DocumentPreviewModal
        documentId={documentId}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}

// Helper function to check if document is processing
export function isDocumentProcessing(primaryVersion?: {
  hasPages?: boolean;
  type?: string | null;
  numPages?: number | null;
}) {
  if (!primaryVersion) return false;

  // Check if document type should have pages but doesn't
  const shouldHavePages = ["pdf", "docs", "slides", "cad"].includes(
    primaryVersion.type || "",
  );

  return shouldHavePages && !primaryVersion.hasPages;
}
