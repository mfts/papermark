import { useRouter } from "next/router";

import { useCallback, useMemo, useState } from "react";

import { useTeam } from "@/context/team-context";
import { Search } from "lucide-react";
import { FileIcon, FolderIcon, FolderPlusIcon, PlusIcon } from "lucide-react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { BreadcrumbComponent } from "@/components/documents/breadcrumb";
import { DocumentsList } from "@/components/documents/documents-list";
import { AddFolderModal } from "@/components/folders/add-folder-modal";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { useDocuments, useFolder } from "@/lib/swr/use-documents";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { fetcher } from "@/lib/utils";

export default function Documents() {
  const router = useRouter();
  const teamInfo = useTeam();

  const { folders } = useFolder({});
  const { documents: allDocuments, isLoading: isLoadingDocuments } =
    useDocuments();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const fetchSearchResults = useCallback(async () => {
    if (!debouncedSearchTerm || !teamInfo?.currentTeam?.id) return null;
    const response = await fetch(
      `/api/teams/${teamInfo.currentTeam.id}/documents/search?query=${encodeURIComponent(debouncedSearchTerm)}`,
    );
    if (!response.ok) throw new Error("Failed to fetch search results");
    return response.json();
  }, [debouncedSearchTerm, teamInfo?.currentTeam?.id]);

  const { data: searchResults, error: searchError } = useSWR<
    DocumentWithLinksAndLinkCountAndViewCount[]
  >(
    debouncedSearchTerm ? ["searchDocuments", debouncedSearchTerm] : null,
    fetchSearchResults,
  );

  const displayedDocuments = useMemo(() => {
    if (debouncedSearchTerm && searchResults) {
      return searchResults;
    }
    return allDocuments;
  }, [debouncedSearchTerm, searchResults, allDocuments]);

  const isLoading =
    isLoadingDocuments || (!searchResults && debouncedSearchTerm);

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
          <div className="flex items-center gap-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                type="text"
                placeholder="Search documents..."
                className="w-64 pl-8 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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

        <section id="documents-header-count" />

        <Separator className="mb-5 bg-gray-200 dark:bg-gray-800" />

        <DocumentsList
          documents={displayedDocuments}
          folders={debouncedSearchTerm ? [] : folders}
          teamInfo={teamInfo}
          isLoading={isLoading}
          searchTerm={debouncedSearchTerm}
        />
      </main>
    </AppLayout>
  );
}
