import { FilePlusIcon, PlusIcon } from "lucide-react";

import { Button } from "../ui/button";
import { AddDocumentModal } from "./add-document-modal";

export function ArchivedEmptyDocuments() {
  return (
    <div className="text-center">
      <FilePlusIcon
        className="mx-auto h-12 w-12 text-muted-foreground"
        strokeWidth={1}
      />
      <h3 className="mt-2 text-sm font-medium text-foreground">
        No archived documents here
      </h3>
      
    </div>
  );
}
