// components/view/dataroom/document-upload-button.tsx
import { useState } from "react";

import { CheckCircle2, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ViewerUploadComponent } from "@/components/viewer-upload-component";

export function DocumentUploadModal({
  linkId,
  dataroomId,
  viewerId,
  folderId,
}: {
  linkId: string;
  dataroomId: string;
  viewerId: string;
  folderId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    // Auto-close the dialog after a short delay to show success message
    setTimeout(() => {
      setIsOpen(false);
      setUploadSuccess(false);
    }, 1500);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setUploadSuccess(false);
    }
  };

  return (
    <>
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

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document to Dataroom</DialogTitle>
            <DialogDescription>
              Your document will appear immediately in the dataroom and will be
              processed in the background. The data room manager will be
              notified of your upload.
            </DialogDescription>
          </DialogHeader>

          {uploadSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="mt-3 text-sm font-medium text-foreground">
                Document uploaded successfully!
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your document is now visible and being processed.
              </p>
            </div>
          ) : (
            <ViewerUploadComponent
              viewerData={{
                id: viewerId,
                linkId,
                dataroomId,
              }}
              teamId="visitor-upload"
              folderId={folderId}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
