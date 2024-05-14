import { FilePlusIcon, PlusIcon } from "lucide-react";

import { Button } from "../ui/button";
import { AddDocumentModal } from "./add-document-modal";

export function EmptyDocuments() {
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
