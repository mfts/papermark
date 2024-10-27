import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { FileIcon, FolderIcon, FolderPlusIcon, PlusIcon } from "lucide-react";

import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { BreadcrumbComponent } from "@/components/documents/breadcrumb";
import { DocumentsList } from "@/components/documents/documents-list";
import SortButton from "@/components/documents/filters/sort-button";
import { AddFolderModal } from "@/components/folders/add-folder-modal";
import AppLayout from "@/components/layouts/app";
import { SearchBoxPersisted } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useFolder, useFolderDocuments } from "@/lib/swr/use-documents";

export default function DocumentTreePage() {
  const router = useRouter();
  const { name, search, sort } = router.query as {
    name: string[];
    sort?: string;
    search?: string;
  };

  const { folders } = useFolder({ name });
  const { documents, isValidating, isFiltered } = useFolderDocuments({
    name,
    sort,
    query: search,
  });
  const teamInfo = useTeam();

  return (
    <AppLayout>
      <main className="p-4 sm:m-4 sm:px-4 sm:py-4">
        <BreadcrumbComponent />

        <section className="mb-4 flex items-center justify-between space-x-2 sm:space-x-0">
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

        <div className="mb-2 flex justify-end gap-x-2">
          <div className="relative w-full sm:max-w-xs">
            <SearchBoxPersisted loading={isValidating} inputClassName="h-10" />
          </div>
          <SortButton />
        </div>
        {/* Portaled in from DocumentsList component */}
        <section id="documents-header-count" />

        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />

        <DocumentsList
          documents={documents}
          folders={isFiltered ? [] : folders}
          teamInfo={teamInfo}
          folderPathName={name}
        />
      </main>
    </AppLayout>
  );
}
