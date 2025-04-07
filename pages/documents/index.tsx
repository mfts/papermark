import { useTeam } from "@/context/team-context";
import { FolderPlusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { useRouter } from "next/router";

import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { DocumentsList } from "@/components/documents/documents-list";
import SortButton from "@/components/documents/filters/sort-button";
import { AddFolderModal } from "@/components/folders/add-folder-modal";
import AppLayout from "@/components/layouts/app";
import { SearchBoxPersisted } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import useDocuments, { useRootFolders } from "@/lib/swr/use-documents";
import { DocumentsPagination } from "@/components/documents/documents-pagination";

export default function Documents() {
  const router = useRouter();
  const teamInfo = useTeam();
  const queryParams = router.query;
  const currentPage = Number(queryParams["page"]) || 1;
  const pageSize = Number(queryParams["limit"]) || 10;

  const { folders } = useRootFolders();
  const { documents, pagination, isValidating, isFiltered } = useDocuments();

  const updatePagination = (newPage?: number, newPageSize?: number) => {
    const params = new URLSearchParams(window.location.search);
    
    if (newPage) params.set("page", newPage.toString());
    if (newPageSize) {
      params.set("limit", newPageSize.toString());
      params.set("page", "1");
    }
    
    router.push(`/documents?${params.toString()}`, undefined, { shallow: true });
  };

  const displayFolders = isFiltered ? [] : folders;

  return (
    <AppLayout>
      <div className="sticky top-0 mb-4 min-h-[calc(100vh-72px)] rounded-lg bg-white p-4 dark:bg-gray-900 sm:mx-4 sm:pt-8">
        <section className="mb-4 flex items-center justify-between space-x-2 sm:space-x-0">
          <div className="space-y-0 sm:space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              All Documents
            </h2>
            <p className="text-xs leading-4 text-muted-foreground sm:text-sm sm:leading-none">
              Manage all your documents in one place.
            </p>
          </div>
          <div className="flex items-center gap-x-2">
            <AddDocumentModal>
              <Button
                className="group flex flex-1 items-center justify-start gap-x-1 whitespace-nowrap px-1 text-left sm:gap-x-3 sm:px-3"
                title="Add Document"
              >
                <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-xs sm:text-base">Add Document</span>
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

        <section id="documents-header-count" />

        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />

        <DocumentsList
          documents={documents}
          folders={displayFolders}
          teamInfo={teamInfo}
        />

        {isFiltered && pagination && (
          <DocumentsPagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalDocuments={pagination.total}
            totalShownDocuments={documents.length}
            totalPages={pagination.pages}
            onPageChange={updatePagination}
            onPageSizeChange={(size) => updatePagination(undefined, size)}
          />
        )}
      </div>
    </AppLayout>
  );
}
