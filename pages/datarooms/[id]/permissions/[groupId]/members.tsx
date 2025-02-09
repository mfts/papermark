import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import { GroupHeader } from "@/components/datarooms/groups/group-header";
import GroupMemberTable from "@/components/datarooms/groups/group-member-table";
import { GroupNavigation } from "@/components/datarooms/groups/group-navigation";
import AppLayout from "@/components/layouts/app";

import { useDataroom } from "@/lib/swr/use-dataroom";
import { useDataroomGroup } from "@/lib/swr/use-dataroom-groups";

export default function DataroomGroupPage() {
  const { dataroom } = useDataroom();
  const { viewerGroup } = useDataroomGroup();

  if (!dataroom || !viewerGroup) {
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

        <GroupHeader dataroomId={dataroom.id} groupName={viewerGroup.name} />
        <div className="mx-auto grid w-full items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <GroupNavigation
            dataroomId={dataroom.id}
            viewerGroupId={viewerGroup.id}
          />
          <div className="grid gap-6">
            <GroupMemberTable
              dataroomId={dataroom.id}
              groupId={viewerGroup.id}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
