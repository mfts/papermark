import useDocuments from "@/lib/swr/use-documents";
import DocumentCard from "@/components/documents/document-card";
import Skeleton from "@/components/Skeleton";
import { PlusIcon } from "@heroicons/react/24/solid";
import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";

export default function Documents() {
  const { documents } = useDocuments();

  return (
    <AppLayout>
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-2xl text-foreground font-semibold tracking-tight">
              Documents
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your documents
            </p>
          </div>
          <ul className="flex items-center justify-between gap-4">
            <AddDocumentModal>
              <Button>Add New Document</Button>
            </AddDocumentModal>
          </ul>
        </div>

        <Separator className="my-6 bg-gray-200 dark:bg-gray-800" />

        {documents && documents.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <EmptyDocuments />
          </div>
        )}

        {/* Documents list */}
        <ul role="list" className="space-y-4">
          {documents
            ? documents.map((document) => {
                return <DocumentCard key={document.id} document={document} />;
              })
            : Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex flex-col space-y-4 px-4 py-4 sm:px-6 lg:px-8"
                >
                  <Skeleton key={i} className="h-5 w-20" />
                  <Skeleton key={i} className="mt-3 h-3 w-10" />
                </li>
              ))}
        </ul>
      </div>
    </AppLayout>
  );
}

export function EmptyDocuments() {
  return (
    <div className="text-center">
      <svg
        className="mx-auto h-12 w-12 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-foreground">No documents</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by uploading a new document.
      </p>
      <div className="mt-6">
        <AddDocumentModal>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-foreground bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Document
          </button>
        </AddDocumentModal>
      </div>
    </div>
  );
}
