import Link from "next/link";

import { useState } from "react";

import { UsersIcon } from "lucide-react";

import { AddViewerModal } from "@/components/datarooms/add-viewer-modal";
import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import { AddGroupModal } from "@/components/datarooms/groups/add-group-modal";
import GroupCard from "@/components/datarooms/groups/group-card";
import AppLayout from "@/components/layouts/app";
import { Button } from "@/components/ui/button";
import DataroomViewersTable from "@/components/visitors/dataroom-viewers";

import { useDataroom } from "@/lib/swr/use-dataroom";
import useDataroomGroups from "@/lib/swr/use-dataroom-groups";
import { cn } from "@/lib/utils";

export default function DataroomGroupPage() {
  const { dataroom } = useDataroom();
  const { viewerGroups, loading } = useDataroomGroups();

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  if (!dataroom) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout>
      <div className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <header>
          <DataroomHeader
            title={dataroom.name}
            description={dataroom.pId}
            actions={[]}
          />

          <DataroomNavigation dataroomId={dataroom.id} />
        </header>

        <div className="space-y-4">
          {/* Groups */}
          <div className="grid gap-5">
            <div className="flex flex-wrap justify-between gap-6">
              <div className="flex items-center gap-x-2">
                <h1 className="text-xl font-semibold tracking-tight text-black">
                  Groups
                </h1>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <div className="w-full sm:w-auto">
                  {/* <SearchBoxPersisted
                    loading={loading}
                    onChangeDebounced={(t) => {
                      if (t) {
                        queryParams({ set: { search: t }, del: "page" });
                      } else {
                        queryParams({ del: "search" });
                      }
                    }}
                  /> */}
                </div>
                {/* <ToggleGroup
                  options={[
                    { value: "active", label: "Active" },
                    { value: "archived", label: "Archived" },
                  ]}
                  selected={archived ? "archived" : "active"}
                  selectAction={(id) =>
                    id === "active"
                      ? queryParams({ del: ["archived", "page"] })
                      : queryParams({ set: { archived: "true" }, del: "page" })
                  }
                /> */}
                {/* <AddDomainButton /> */}
                <Button onClick={() => setModalOpen(true)}>Create group</Button>
              </div>
            </div>
            {/* {workspaceId && <AddEditDomainModal />} */}
            <div className="animate-fade-in">
              {!loading ? (
                viewerGroups && viewerGroups.length > 0 ? (
                  <ul className="grid grid-cols-1 gap-3">
                    {viewerGroups.map((group) => (
                      <li key={group.id}>
                        <Link
                          href={`/datarooms/${dataroom.id}/groups/${group.id}`}
                        >
                          <GroupCard group={group} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 py-10">
                    <div className="hidden rounded-full border border-gray-200 sm:block">
                      <div
                        className={cn(
                          "rounded-full border border-white bg-gradient-to-t from-gray-100 p-1 md:p-3",
                        )}
                      >
                        <UsersIcon className="size-6" />
                      </div>
                    </div>
                    <p>No groups found for this dataroom</p>
                    <Button onClick={() => setModalOpen(true)}>
                      Create group
                    </Button>
                  </div>
                )
              ) : (
                <ul className="grid grid-cols-1 gap-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <li key={idx}>
                      {/* <DomainCardPlaceholder /> */}
                      Loading...
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* <Pagination
              pageSize={50}
              totalCount={domainsCount || 0}
              unit="domains"
            /> */}
          </div>

          <AddGroupModal
            dataroomId={dataroom.id}
            open={modalOpen}
            setOpen={setModalOpen}
          />
        </div>
      </div>
    </AppLayout>
  );
}
