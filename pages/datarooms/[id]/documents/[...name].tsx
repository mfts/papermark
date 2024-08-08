import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import {
  ArrowUpDownIcon,
  CheckIcon,
  FileIcon,
  FolderIcon,
  FolderPlusIcon,
  PlusIcon,
} from "lucide-react";

import { BreadcrumbComponent } from "@/components/datarooms/dataroom-breadcrumb";
import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { SidebarFolderTree } from "@/components/datarooms/folders";
import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { DocumentsList } from "@/components/documents/documents-list";
import { AddFolderModal } from "@/components/folders/add-folder-modal";
import AppLayout from "@/components/layouts/app";
import { NavMenu } from "@/components/navigation-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import {
  useDataroom,
  useDataroomFolderDocuments,
  useDataroomFolders,
} from "@/lib/swr/use-dataroom";

export default function Documents() {
  const router = useRouter();
  const { name } = router.query as { name: string[] };

  const { dataroom } = useDataroom();
  const { folders } = useDataroomFolders({ name });
  const { documents } = useDataroomFolderDocuments({ name });

  const teamInfo = useTeam();

  const [reorderItems, setReorderItems] = useState<boolean>(false);

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

          <NavMenu
            navigation={[
              {
                label: "Overview",
                href: `/datarooms/${dataroom?.id}`,
                segment: `${dataroom?.id}`,
              },
              {
                label: "Documents",
                href: `/datarooms/${dataroom?.id}/documents`,
                segment: "documents",
              },
              {
                label: "Users",
                href: `/datarooms/${dataroom?.id}/users`,
                segment: "users",
              },
              {
                label: "Customization",
                href: `/datarooms/${dataroom?.id}/branding`,
                segment: "branding",
              },
              {
                label: "Settings",
                href: `/datarooms/${dataroom?.id}/settings`,
                segment: "settings",
              },
            ]}
          />
        </header>

        <div className="grid h-full gap-4 pb-2 md:grid-cols-4">
          <div className="h-full truncate md:col-span-1">
            <ScrollArea showScrollbar>
              <SidebarFolderTree dataroomId={dataroom?.id!} />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <div className="space-y-4 md:col-span-3">
            <div className="flex justify-between">
              <div className="space-y-2">
                <BreadcrumbComponent />
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
              </div>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-x-1"
                  onClick={() => setReorderItems(!reorderItems)}
                >
                  {reorderItems ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <ArrowUpDownIcon className="h-4 w-4" />
                  )}
                  {reorderItems ? "Save index" : "Edit index"}
                </Button>
              </div>
            </div>

            {reorderItems ? (
              <DataroomSortableList
                documents={documents}
                folders={folders}
                teamInfo={teamInfo}
                dataroomId={dataroom?.id!}
              />
            ) : (
              <DocumentsList
                documents={documents}
                folders={folders}
                teamInfo={teamInfo}
                folderPathName={name}
                dataroomId={dataroom?.id}
              />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
