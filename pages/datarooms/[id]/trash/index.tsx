import { useState } from "react";

import { useTeam } from "@/context/team-context";

import { useDataroom, useDataroomTrashItems } from "@/lib/swr/use-dataroom";

import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import { DataroomTrashItemsList } from "@/components/datarooms/dataroom-trash-items-list";
import { SidebarFolderTree } from "@/components/datarooms/folders";
import { LoadingDocuments } from "@/components/documents/loading-document";
import AppLayout from "@/components/layouts/app";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function Documents() {
  const { dataroom } = useDataroom();
  const { items, folderCount, documentCount, isLoading } =
    useDataroomTrashItems({
      root: true,
    });

  console.log("items", items);
  const teamInfo = useTeam();

  const [isReordering, setIsReordering] = useState<boolean>(false);

  return (
    <AppLayout>
      <div className="relative mx-2 mb-10 mt-4 space-y-4 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header>
          <DataroomHeader
            title={dataroom?.name ?? ""}
            description={dataroom?.pId ?? ""}
            actions={[]}
          />
          <DataroomNavigation dataroomId={dataroom?.id} />
        </header>

        <div className="grid h-full gap-4 pb-2 md:grid-cols-4">
          <div className="h-full truncate md:col-span-1">
            <ScrollArea showScrollbar>
              <SidebarFolderTree dataroomId={dataroom?.id ?? ""} trash={true} />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <div className="space-y-4 md:col-span-3">
            {isLoading || !dataroom ? <LoadingDocuments count={3} /> : null}{" "}
            <DataroomTrashItemsList
              mixedItems={items ?? []}
              teamInfo={teamInfo}
              dataroomId={dataroom?.id!}
              folderCount={folderCount}
              documentCount={documentCount}
              root={true}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
