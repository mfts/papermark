import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { FolderPlusIcon, PlusIcon } from "lucide-react";
import { useFolder, useFolderDocuments } from "@/lib/swr/use-documents";

import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { DocumentsList } from "@/components/documents/documents-list";
import SortButton from "@/components/documents/filters/sort-button";
import { AddFolderModal } from "@/components/folders/add-folder-modal";
import AppLayout from "@/components/layouts/app";
import { SearchBoxPersisted } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";


export default function DocumentTreePage() {
  const router = useRouter();
  const { name } = router.query as { name: string[] };

  const {
    folders,
    loading: foldersLoading,
    isValidating: foldersValidating,
  } = useFolder({ name });
  const { documents, loading, isValidating } = useFolderDocuments({ name });
  const teamInfo = useTeam();

  const isSorting = !!router.query.sort;
  const displayFolders = isSorting ? [] : folders;

  return (
    <AppLayout>
      <main className="p-4 sm:m-4 sm:px-4 sm:py-4">
        <section className="mb-4 mt-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              All Documents
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Manage all your documents in one place.
            </p>
          </div>
          <div className="flex items-center gap-x-2">
            <AddDocumentModal>
              <Button className="gap-x-3 px-3" title="Add Document">
                <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Add Document</span>
              </Button>
            </AddDocumentModal>
            <AddFolderModal>
              <Button
                // size="icon"
                variant="outline"
                className="gap-x-3 px-3"
              >
                <FolderPlusIcon
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
                <span>Add Folder</span>
              </Button>
            </AddFolderModal>
          </div>
        </section>

        <div className="mb-2 flex justify-end gap-x-2">
          <div className="relative w-full sm:max-w-xs">
            <SearchBoxPersisted
              loading={isValidating || foldersValidating}
              inputClassName="h-10"
            />
          </div>
          <SortButton />
        </div>

        {/* Portaled in from DocumentsList component */}
        <section id="documents-header-count" />

        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />

        <DocumentsList
          documents={documents}
          folders={displayFolders}
          teamInfo={teamInfo}
          folderPathName={name}
          loading={loading}
          foldersLoading={foldersLoading}
        />
      </main>
    </AppLayout>
  );
}
