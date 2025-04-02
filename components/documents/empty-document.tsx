import { FilePlusIcon, PlusIcon } from "lucide-react";

import { Button } from "../ui/button";
import { AddDocumentModal } from "./add-document-modal";

export function EmptyDocuments({
  title,
  description,
  showAddDocumentBtn = false,
}: {
  title: string;
  description: string;
  showAddDocumentBtn?: boolean;
}) {
  return (
    <div className="text-center">
      <FilePlusIcon
        className="mx-auto h-12 w-12 text-muted-foreground"
        strokeWidth={1}
      />
      <h3 className="mt-2 text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {showAddDocumentBtn && (
        <div className="mt-6">
          <AddDocumentModal>
            <Button
              className="flex w-full items-center justify-center gap-x-3 px-3"
              title="Add New Document"
            >
              <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Add Document</span>
            </Button>
          </AddDocumentModal>
        </div>
      )}
    </div>
  );
}
