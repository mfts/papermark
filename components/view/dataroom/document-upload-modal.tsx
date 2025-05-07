// components/view/dataroom/document-upload-button.tsx
import { useEffect, useState } from "react";

import { Document } from "@prisma/client";
import { FileText, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ViewerUploadComponent } from "@/components/viewer-upload-component";

import { DocumentVersion } from "../viewer/dataroom-viewer";

export function DocumentUploadModal({
  linkId,
  dataroomId,
  viewerId,
  folderId,
  onUploadSuccess,
  documentCount: initialDocumentCount = 0,
}: {
  linkId: string;
  dataroomId: string;
  viewerId: string;
  folderId?: string;
  documentCount?: number;
  onUploadSuccess?: (
    document: Document & { versions: DocumentVersion[] },
  ) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localDocumentCount, setLocalDocumentCount] =
    useState(initialDocumentCount);

  useEffect(() => {
    setLocalDocumentCount(initialDocumentCount);
  }, [initialDocumentCount]);

  const handleUploadSuccess = (
    document: Document & { versions: DocumentVersion[] },
  ) => {
    setLocalDocumentCount((prev) => prev + 1);
    onUploadSuccess?.(document);
    setIsOpen(false);
    toast.success(
      "Document uploaded successfully. Waiting for admin approval.",
    );
  };

  return (
    <>
      <div className="flex items-center gap-x-2">
        {localDocumentCount > 0 && (
          <div className="flex items-center gap-x-1 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
            <FileText className="h-3 w-3" />
            <span>
              {localDocumentCount}{" "}
              {localDocumentCount === 1 ? "document " : "documents "}
              uploaded
            </span>
          </div>
        )}
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="outline"
          className="group flex items-center justify-start gap-x-3 px-3 text-left"
          title="Add Document"
        >
          <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Add Document</span>
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document to Dataroom</DialogTitle>
            <DialogDescription>
              The data room manager will receive a notification when the
              document is uploaded and approve the document. Only then, it will
              be visible to all visitors.
            </DialogDescription>
          </DialogHeader>
          <ViewerUploadComponent
            viewerData={{
              id: viewerId,
              linkId,
              dataroomId,
            }}
            teamId="visitor-upload"
            folderId={folderId}
            onSuccess={handleUploadSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}