import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import StatsCard from "@/components/datarooms/stats-card";
import AppLayout from "@/components/layouts/app";
import DataroomVisitorsTable from "@/components/visitors/dataroom-visitors-table";

import { useDataroom } from "@/lib/swr/use-dataroom";

export default function DataroomAnalyticsPage() {
  const { dataroom } = useDataroom();

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

        <div className="space-y-8">
          <StatsCard />
          <DataroomVisitorsTable dataroomId={dataroom.id} />
        </div>
      </div>
    </AppLayout>
  );
}
