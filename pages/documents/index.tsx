import { useTeam } from "@/context/team-context";
import { FolderPlusIcon, PlusIcon } from "lucide-react";
import ErrorPage from "next/error";
import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { DocumentsList } from "@/components/documents/documents-list";
import { AddFolderModal } from "@/components/folders/add-folder-modal";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import useDocuments, { useRootFolders } from "@/lib/swr/use-documents";

export default function Documents() {
  const { documents,error } = useDocuments();
  const { folders } = useRootFolders();
  const teamInfo = useTeam();

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }
  if (error && error.status === 500) {
    return <ErrorPage statusCode={500} />;
  }

  return (
    <AppLayout>
      <div className="sticky top-0 z-50 bg-white p-4 pb-0 dark:bg-gray-900 sm:mx-4 sm:pt-8">
        <section className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              All Documents
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Manage all your documents in one place.
            </p>
          </div>
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

        {/* Portaled in from DocumentsList component */}
        <section id="documents-header-count" />

        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="p-4 pt-0 sm:mx-4 sm:mt-4">
        <DocumentsList
          documents={documents}
          folders={folders}
          teamInfo={teamInfo}
        />
      </div>
    </AppLayout>
  );
}
