import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { ArrowUpDownIcon, FolderPlusIcon, PlusIcon } from "lucide-react";

import { BreadcrumbComponent } from "@/components/datarooms/dataroom-breadcrumb";
import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomItemsList } from "@/components/datarooms/dataroom-items-list";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import { SidebarFolderTree } from "@/components/datarooms/folders";
import { DataroomSortableList } from "@/components/datarooms/sortable/sortable-list";
import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { LoadingDocuments } from "@/components/documents/loading-document";
import { AddFolderModal } from "@/components/folders/add-folder-modal";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { useDataroom, useDataroomItems } from "@/lib/swr/use-dataroom";

export default function Documents() {
  const { dataroom } = useDataroom();
  const { items, folderCount, documentCount, isLoading } = useDataroomItems({
    root: true,
  });
  const teamInfo = useTeam();

  const [isReordering, setIsReordering] = useState<boolean>(false);

  return (
    <AppLayout>
      <div className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header>
          <DataroomHeader
            title={dataroom?.name ?? ""}
            description={dataroom?.pId ?? ""}
            actions={[
              <AddDocumentModal
                isDataroom={true}
                dataroomId={dataroom?.id}
                key={1}
              >
                <Button
                  className="group flex flex-1 items-center justify-start gap-x-3 px-3 text-left"
                  title="Add New Document"
                >
                  <PlusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>Add New Document</span>
                </Button>
              </AddDocumentModal>,
              <AddFolderModal
                isDataroom={true}
                dataroomId={dataroom?.id}
                key={2}
              >
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
              </AddFolderModal>,
            ]}
          />

          <DataroomNavigation dataroomId={dataroom?.id} />
        </header>

        <div className="grid h-full gap-4 pb-2 md:grid-cols-4">
          <div className="h-full truncate md:col-span-1">
            <ScrollArea showScrollbar>
              <SidebarFolderTree dataroomId={dataroom?.id!} />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <div className="space-y-4 md:col-span-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <BreadcrumbComponent />
              </div>
              <div id="dataroom-reordering-action">
                {!isReordering ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-x-1"
                    onClick={() => setIsReordering(!isReordering)}
                  >
                    <ArrowUpDownIcon className="h-4 w-4" />
                    Edit index
                  </Button>
                ) : null}
              </div>
            </div>
            <section id="documents-header-count" className="min-h-8" />

            {isLoading ? <LoadingDocuments count={3} /> : null}

            {isReordering ? (
              <DataroomSortableList
                mixedItems={items}
                teamInfo={teamInfo}
                dataroomId={dataroom?.id!}
                setIsReordering={setIsReordering}
              />
            ) : (
              <DataroomItemsList
                mixedItems={items}
                teamInfo={teamInfo}
                dataroomId={dataroom?.id!}
                folderCount={folderCount}
                documentCount={documentCount}
              />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
