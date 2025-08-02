import { BookOpenIcon, FileTextIcon } from "lucide-react";

interface ConversationDocumentContextProps {
  dataroomDocument?: {
    document: {
      name: string;
      type?: string;
    };
  };
  documentPageNumber?: number | null;
  documentVersionNumber?: number | null;
  className?: string;
  showVersionNumber?: boolean; // Controls whether to show version info
}

export function ConversationDocumentContext({
  dataroomDocument,
  documentPageNumber,
  documentVersionNumber,
  className = "",
  showVersionNumber = false,
}: ConversationDocumentContextProps) {
  if (!dataroomDocument) return null;

  const hasPageOrVersion =
    documentPageNumber || (showVersionNumber && documentVersionNumber);

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <FileTextIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">
          {dataroomDocument.document.name}
        </span>
      </div>

      {hasPageOrVersion && (
        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          {documentPageNumber && (
            <span className="flex items-center gap-1">
              <BookOpenIcon className="h-3 w-3" />
              Page {documentPageNumber}
            </span>
          )}
          {documentPageNumber && showVersionNumber && documentVersionNumber && (
            <span>•</span>
          )}
          {showVersionNumber && documentVersionNumber && (
            <span>v{documentVersionNumber}</span>
          )}
        </div>
      )}
    </div>
  );
}
