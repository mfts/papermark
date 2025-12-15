import { FilePlusIcon, PlusIcon, UploadIcon } from "lucide-react";

import { Button } from "../ui/button";
import { AddDocumentModal } from "./add-document-modal";

export function EmptyDocuments({
  isDataroom = false,
}: {
  isDataroom?: boolean;
}) {
  if (isDataroom) {
    return (
      <div className="flex w-full items-center justify-center py-8">
        <div className="flex min-h-[300px] w-full max-w-2xl items-center justify-center rounded-lg border border-dashed border-black/25 dark:border-white/25">
          <div className="text-center">
            <UploadIcon
              className="mx-auto h-10 w-10 text-gray-500"
              aria-hidden="true"
            />
            <h3 className="mt-4 text-sm font-semibold leading-6 text-gray-500">
              Drag and Drop for Bulk Upload
            </h3>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              No documents. Get started by uploading document.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <FilePlusIcon
        className="mx-auto h-12 w-12 text-muted-foreground"
        strokeWidth={1}
      />
      <h3 className="mt-2 text-sm font-medium text-foreground">
        No documents here
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by uploading a new document.
      </p>
      {/* <div className="mt-6">
        <AddDocumentModal>
          <Button
            className="w-full flex gap-x-3 items-center justify-center px-3"
            title="Add New Document"
          >
            <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Add Document</span>
          </Button>
        </AddDocumentModal>
      </div> */}
    </div>
  );
}
