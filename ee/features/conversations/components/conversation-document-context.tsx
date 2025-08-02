import { FileTextIcon, BookOpenIcon } from "lucide-react";

interface ConversationDocumentContextProps {
  dataroomDocument?: {
    document: {
      name: string;
      type?: string;
    };
  };
  documentPageNumber?: number;
  documentVersionNumber?: number;
  className?: string;
}

export function ConversationDocumentContext({
  dataroomDocument,
  documentPageNumber,
  documentVersionNumber,
  className = "",
}: ConversationDocumentContextProps) {
  if (!dataroomDocument) return null;

  const hasPageOrVersion = documentPageNumber || documentVersionNumber;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm ${className}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FileTextIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium truncate">
          {dataroomDocument.document.name}
        </span>
      </div>
      
      {hasPageOrVersion && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          {documentPageNumber && (
            <span className="flex items-center gap-1">
              <BookOpenIcon className="h-3 w-3" />
              Page {documentPageNumber}
            </span>
          )}
          {documentPageNumber && documentVersionNumber && (
            <span>•</span>
          )}
          {documentVersionNumber && (
            <span>v{documentVersionNumber}</span>
          )}
        </div>
      )}
    </div>
  );
}