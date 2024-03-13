import useDocuments from "@/lib/swr/use-documents";
import { useTeam } from "@/context/team-context";
import DocumentCard from "@/components/documents/document-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon } from "lucide-react";
import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import Folder from "@/components/shared/icons/folder";

export default function Documents() {
  const { documents } = useDocuments();
  const teamInfo = useTeam();

  return (
    <AppLayout>
      <div className="p-4 sm:py-4 sm:px-10 sm:m-4">
        <section className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl text-foreground font-semibold tracking-tight">
              All Documents
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage all your documents in one place.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <AddDocumentModal>
              <Button
                size="icon"
                className="fixed bottom-6 right-5 z-30 lg:hidden sm:bottom-0 sm:right-0 sm:relative w-10 sm:w-44 h-10 sm:h-10"
              >
                <span className="hidden sm:block">Add New Document</span>
                <span className="block sm:hidden">
                  <PlusIcon className="w-6 h-6" />
                </span>
              </Button>
            </AddDocumentModal>
          </div>
        </section>

        {documents && documents.length > 0 ? (
          <p className="text-sm text-gray-400 mt-8 sm:mt-5 mb-2 flex items-center">
            <Folder className="w-[16px] h-[16px] mr-1" /> Total documents{" "}
            {documents.length}
          </p>
        ) : null}

        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />

        {documents && documents.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <EmptyDocuments />
          </div>
        )}

        {/* Documents list */}
        <ul role="list" className="space-y-4">
          {documents
            ? documents
                .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1))
                .map((document) => {
                  return (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      teamInfo={teamInfo}
                    />
                  );
                })
            : Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="relative w-full py-5 px-4 border rounded-lg flex items-center space-x-3 sm:px-6 lg:px-6"
                >
                  <Skeleton key={i} className="h-9 w-9" />
                  <div>
                    <Skeleton key={i} className="h-4 w-32" />
                    <Skeleton key={i + 1} className="mt-2 h-3 w-12" />
                  </div>
                  <Skeleton
                    key={i + 1}
                    className="h-5 w-20 absolute top-[50%] transform -translate-y-[50%] right-5"
                  />
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
          <Button
            className="w-full text-left group flex gap-x-3 items-center justify-start px-3"
            title="Add New Document"
          >
            <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Add Document</span>
          </Button>
        </AddDocumentModal>
      </div>
    </div>
  );
}
