import { FilePlusIcon, Trash2Icon } from "lucide-react";

export function EmptyDocuments({ trash }: { trash?: boolean }) {
  return (
    <div className="text-center">
      {trash ? (
        <Trash2Icon
          className="mx-auto h-12 w-12 text-muted-foreground"
          strokeWidth={1}
        />
      ) : (
        <FilePlusIcon
          className="mx-auto h-12 w-12 text-muted-foreground"
          strokeWidth={1}
        />
      )}
      <h3 className="mt-2 text-sm font-medium text-foreground">
        {trash ? "No trash items here" : "No documents here"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {trash
          ? "Items you delete will appear here, and will be deleted permanently after 30 days."
          : "Get started by uploading a new document."}
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
