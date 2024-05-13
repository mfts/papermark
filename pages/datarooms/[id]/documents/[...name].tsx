import useDocuments, { useRootFolders } from "@/lib/swr/use-documents";
import { useTeam } from "@/context/team-context";
import DocumentCard from "@/components/documents/document-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileIcon, FolderIcon, FolderPlusIcon, PlusIcon } from "lucide-react";
import { AddDocumentModal } from "@/components/documents/add-document-modal";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import Folder from "@/components/shared/icons/folder";
import FolderCard from "@/components/documents/folder-card";
import { EmptyDocuments } from "@/components/documents/empty-document";
import { AddFolderModal } from "@/components/folders/add-folder-modal";
import {
  useDataroom,
  useDataroomFolderDocuments,
  useDataroomFolders,
} from "@/lib/swr/use-dataroom";
import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { NavMenu } from "@/components/navigation-menu";
import { BreadcrumbComponent } from "@/components/datarooms/dataroom-breadcrumb";
import { useRouter } from "next/router";
import DataroomDocumentCard from "@/components/datarooms/dataroom-document-card";
import { SidebarFolderTree } from "@/components/datarooms/folders";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function Documents() {
  const router = useRouter();
  const { name } = router.query as { name: string[] };

  const { dataroom } = useDataroom();
  const { folders } = useDataroomFolders({ name });
  const { documents } = useDataroomFolderDocuments({ name });

  const teamInfo = useTeam();

  return (
    <AppLayout>
      <div className="relative overflow-hidden mx-2 sm:mx-3 md:mx-5 lg:mx-7 xl:mx-10 mt-4 md:mt-5 lg:mt-8 mb-10 space-y-8 px-1">
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
                  className="flex-1 text-left group flex gap-x-3 items-center justify-start px-3"
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
                  className="bg-gray-50 dark:bg-black border-gray-500 hover:bg-gray-200 hover:dark:bg-muted"
                >
                  <FolderPlusIcon
                    className="w-5 h-5 shrink-0"
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
                href: `/datarooms/${dataroom?.id}/settings`,
                segment: "settings",
              },
            ]}
          />
        </header>

        <div className="grid md:grid-cols-4 gap-4 h-full">
          <div className="md:col-span-1 truncate h-full">
            <ScrollArea showScrollbar>
              <SidebarFolderTree dataroomId={dataroom?.id!} />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <div className="md:col-span-3 space-y-4">
            <BreadcrumbComponent />
            <section className="flex items-center gap-x-2 mb-2">
              {folders && folders.length > 0 ? (
                <p className="text-sm text-gray-400 flex items-center gap-x-1">
                  <FolderIcon className="w-4 h-4" />
                  <span>{folders.length} folders</span>
                </p>
              ) : null}
              {documents && documents.length > 0 ? (
                <p className="text-sm text-gray-400 flex items-center gap-x-1">
                  <FileIcon className="w-4 h-4" />
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
