import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { FileIcon, FolderIcon, FolderPlusIcon, PlusIcon } from "lucide-react";

import { BreadcrumbComponent } from "@/components/datarooms/dataroom-breadcrumb";
import DataroomDocumentCard from "@/components/datarooms/dataroom-document-card";
import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { SidebarFolderTree } from "@/components/datarooms/folders";
import { AddDocumentModal } from "@/components/documents/add-document-modal";
import DocumentCard from "@/components/documents/document-card";
import { EmptyDocuments } from "@/components/documents/empty-document";
import FolderCard from "@/components/documents/folder-card";
import { AddFolderModal } from "@/components/folders/add-folder-modal";
import AppLayout from "@/components/layouts/app";
import { NavMenu } from "@/components/navigation-menu";
import Folder from "@/components/shared/icons/folder";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useDataroom,
  useDataroomFolderDocuments,
  useDataroomFolders,
} from "@/lib/swr/use-dataroom";
import useDocuments, { useRootFolders } from "@/lib/swr/use-documents";

export default function Documents() {
  const router = useRouter();
  const { name } = router.query as { name: string[] };

  const { dataroom } = useDataroom();
  const { folders } = useDataroomFolders({ name });
  const { documents } = useDataroomFolderDocuments({ name });

  const teamInfo = useTeam();

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

        <div className="grid h-full gap-4 md:grid-cols-4">
          <div className="h-full truncate md:col-span-1">
            <ScrollArea showScrollbar>
              <SidebarFolderTree dataroomId={dataroom?.id!} />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <div className="space-y-4 md:col-span-3">
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
            {/* Folders list */}
            <ul role="list" className="space-y-4">
              {folders
                ? folders.map((folder) => {
                    return (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        teamInfo={teamInfo}
                        isDataroom={true}
                        dataroomId={dataroom?.id}
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
                      <DataroomDocumentCard
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
          </div>
        </div>

        <div className="space-y-4">
          {documents && documents.length === 0 && (
            <div className="flex items-center justify-center">
              <EmptyDocuments />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
