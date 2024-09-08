import Link from "next/link";

import { useState } from "react";

import { ViewerGroup } from "@prisma/client";
import {
  ChevronRight,
  ChevronRightIcon,
  CogIcon,
  FileSlidersIcon,
  UsersIcon,
} from "lucide-react";

import { AddViewerModal } from "@/components/datarooms/add-viewer-modal";
import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import { AddGroupModal } from "@/components/datarooms/groups/add-group-modal";
import GroupCard from "@/components/datarooms/groups/group-card";
import GroupMemberTable from "@/components/datarooms/groups/group-member-table";
import AppLayout from "@/components/layouts/app";
import { BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataroomViewersTable from "@/components/visitors/dataroom-viewers";

import { useDataroom } from "@/lib/swr/use-dataroom";
import { useDataroomGroup } from "@/lib/swr/use-dataroom-groups";

export default function DataroomGroupPage({
  groups,
}: {
  groups: ViewerGroup[];
}) {
  const { dataroom } = useDataroom();
  const { viewerGroup } = useDataroomGroup();

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

        <div className="mx-auto flex w-full items-center gap-2">
          <Link href={`/datarooms/${dataroom.id}/groups`}>
            <h2 className="text-lg">All Groups</h2>
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <h2 className="text-lg font-semibold text-primary">
            {viewerGroup?.name ?? "Management Team"}
          </h2>
        </div>
        <div className="mx-auto grid w-full items-start gap-4 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav className="grid text-sm text-muted-foreground">
            <Link
              href={`/datarooms/${dataroom.id}/groups/${viewerGroup?.id}`}
              className="flex items-center gap-x-2 rounded-md p-2 text-primary hover:bg-muted"
            >
              <CogIcon className="h-4 w-4" />
              General
            </Link>
            <Link
              href={`/datarooms/${dataroom.id}/groups/${viewerGroup?.id}/members`}
              className="flex items-center gap-x-2 rounded-md bg-muted p-2 font-medium text-primary"
            >
              <UsersIcon className="h-4 w-4" />
              Members
            </Link>
            <Link
              href={`/datarooms/${dataroom.id}/groups/${viewerGroup?.id}/permissions`}
              className="flex items-center gap-x-2 p-2 text-primary hover:bg-muted"
            >
              <FileSlidersIcon className="h-4 w-4" />
              Permissions
            </Link>
          </nav>
          <div className="grid gap-6">
            <GroupMemberTable
              dataroomId={dataroom.id}
              groupId={viewerGroup?.id!}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
