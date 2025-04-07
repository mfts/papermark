import { useTeam } from "@/context/team-context";
import { AlertCircleIcon } from "lucide-react";
import useSWR from "swr";

import { useDataroom } from "@/lib/swr/use-dataroom";
import { fetcher } from "@/lib/utils";

import { DataroomHeader } from "@/components/datarooms/dataroom-header";
import { DataroomNavigation } from "@/components/datarooms/dataroom-navigation";
import StatsCard from "@/components/datarooms/stats-card";
import AppLayout from "@/components/layouts/app";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DataroomVisitorsTable from "@/components/visitors/dataroom-visitors-table";

export default function DataroomAnalyticsPage() {
  const teamInfo = useTeam();
  const { dataroom } = useDataroom();
  const { data: features } = useSWR<{ roomChangeNotifications: boolean }>(
    teamInfo?.currentTeam?.id
      ? `/api/feature-flags?teamId=${teamInfo.currentTeam.id}`
      : null,
    fetcher,
  );

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

        {features?.roomChangeNotifications && (
          <Alert>
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Dataroom Change Notifications</AlertTitle>
            <AlertDescription>
              Verified visitors will be automatically notified by email when new
              documents are added to this dataroom.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          <StatsCard />
          <DataroomVisitorsTable dataroomId={dataroom.id} />
        </div>
      </div>
    </AppLayout>
  );
}
