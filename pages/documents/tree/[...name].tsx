import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { FileIcon, FolderIcon, FolderPlusIcon, PlusIcon } from "lucide-react";

import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { BreadcrumbComponent } from "@/components/documents/breadcrumb";
import DocumentCard from "@/components/documents/document-card";
import { EmptyDocuments } from "@/components/documents/empty-document";
import FolderCard from "@/components/documents/folder-card";
import { AddFolderModal } from "@/components/folders/add-folder-modal";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { useFolder, useFolderDocuments } from "@/lib/swr/use-documents";

export default function DocumentTreePage() {
  const router = useRouter();
  const { name } = router.query as { name: string[] };

  const { folders } = useFolder({ name });
  const { documents } = useFolderDocuments({ name });
  const teamInfo = useTeam();

  return (
    <AppLayout>
      <main className="p-4 sm:m-4 sm:px-4 sm:py-4">
        <BreadcrumbComponent />

        <section className="mb-4 mt-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              All Documents
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Manage all your documents in one place.
            </p>
          </div>
          {/* <div className="flex items-center justify-between gap-4">
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
          </div> */}
          <div className="flex items-center gap-x-1">
            <AddDocumentModal>
              <Button
                className="group flex flex-1 items-center justify-start gap-x-3 px-3 text-left"
                title="Add New Document"
              >
                <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Add New Document</span>
              </Button>
            </AddDocumentModal>
            <AddFolderModal>
              <Button
                size="icon"
                variant="outline"
                className="border-gray-500 bg-gray-50 hover:bg-gray-200 dark:bg-black hover:dark:bg-muted"
              >
                <FolderPlusIcon
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
              </Button>
            </AddFolderModal>
          </div>
        </section>

        <section className="mb-2 flex items-center gap-x-2">
          {folders && folders.length > 0 ? (
            <p className="flex items-center gap-x-1 text-sm text-gray-400">
              <FolderIcon className="h-4 w-4" />
              <span>{folders.length} folders</span>
            </p>
          ) : null}
          {documents && documents.length > 0 ? (
            <p className="flex items-center gap-x-1 text-sm text-gray-400">
              <FileIcon className="h-4 w-4" />
              <span>{documents.length} documents</span>
            </p>
          ) : null}
        </section>

        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />

        <div className="space-y-4">
          {/* Folders list */}
          <ul role="list" className="space-y-4">
            {folders
              ? folders.map((folder) => {
                  return (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      teamInfo={teamInfo}
                    />
                  );
                })
              : Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={i}
                    className="relative flex w-full items-center space-x-3 rounded-lg border px-4 py-5 sm:px-6 lg:px-6"
                  >
                    <Skeleton key={i} className="h-9 w-9" />
                    <div>
                      <Skeleton key={i} className="h-4 w-32" />
                      <Skeleton key={i + 1} className="mt-2 h-3 w-12" />
                    </div>
                    <Skeleton
                      key={i + 1}
                      className="absolute right-5 top-[50%] h-5 w-20 -translate-y-[50%] transform"
                    />
                  </li>
                ))}
          </ul>

          {/* Documents list */}
          <ul role="list" className="space-y-4">
            {documents
              ? documents.map((document) => {
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
                    className="relative flex w-full items-center space-x-3 rounded-lg border px-4 py-5 sm:px-6 lg:px-6"
                  >
                    <Skeleton key={i} className="h-9 w-9" />
                    <div>
                      <Skeleton key={i} className="h-4 w-32" />
                      <Skeleton key={i + 1} className="mt-2 h-3 w-12" />
                    </div>
                    <Skeleton
                      key={i + 1}
                      className="absolute right-5 top-[50%] h-5 w-20 -translate-y-[50%] transform"
                    />
                  </li>
                ))}
          </ul>

          {documents && documents.length === 0 && (
            <div className="flex h-96 items-center justify-center">
              <EmptyDocuments />
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
