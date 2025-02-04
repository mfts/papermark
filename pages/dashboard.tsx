import { useRouter } from "next/router";

import { useEffect } from "react";

import { useTeam } from "@/context/team-context";
import { BarChart3, Eye, FileText, Link, Users } from "lucide-react";
import useSWR from "swr";

import { AnalyticsCard } from "@/components/analytics/analytics-card";
import DashboardViewsChart from "@/components/analytics/dashboard-views-chart";
import DocumentsTable from "@/components/analytics/documents-table";
import LinksTable from "@/components/analytics/links-table";
import {
  TimeRange,
  TimeRangeSelect,
} from "@/components/analytics/time-range-select";
import ViewsTable from "@/components/analytics/views-table";
import VisitorsTable from "@/components/analytics/visitors-table";
import AppLayout from "@/components/layouts/app";
import { TabMenu } from "@/components/tab-menu";

import { fetcher } from "@/lib/utils";

interface OverviewData {
  counts: {
    links: number;
    documents: number;
    visitors: number;
    views: number;
  };
  graph: {
    date: string;
    views: number;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const teamInfo = useTeam();
  const { interval = "7d", type = "links" } = router.query as {
    interval: TimeRange;
    type: string;
  };

  // Fetch overview data
  const { data: overview, isLoading } = useSWR<OverviewData>(
    teamInfo?.currentTeam?.id
      ? `/api/analytics?type=overview&interval=${interval}&teamId=${teamInfo.currentTeam.id}`
      : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  // Update the URL when time range changes
  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    const params = new URLSearchParams(window.location.search);
    params.set("interval", newTimeRange);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <TimeRangeSelect value={interval} onChange={handleTimeRangeChange} />
        </div>

        <div className="space-y-4">
          <AnalyticsCard
            title="Views Overview"
            icon={<BarChart3 className="h-4 w-4" />}
            contentClassName="space-y-4"
          >
            <DashboardViewsChart timeRange={interval} data={overview?.graph} />
          </AnalyticsCard>

          <TabMenu
            navigation={[
              {
                label: "Links",
                href: `/dashboard?interval=${interval}&type=links`,
                value: "links",
                currentValue: type,
                count: overview?.counts.links,
              },
              {
                label: "Documents",
                href: `/dashboard?interval=${interval}&type=documents`,
                value: "documents",
                currentValue: type,
                count: overview?.counts.documents,
              },
              {
                label: "Visitors",
                href: `/dashboard?interval=${interval}&type=visitors`,
                value: "visitors",
                currentValue: type,
                count: overview?.counts.visitors,
              },
              {
                label: "Recent Visits",
                href: `/dashboard?interval=${interval}&type=views`,
                value: "views",
                currentValue: type,
                count: overview?.counts.views,
              },
            ]}
          />

          <div className="grid grid-cols-1">
            {type === "links" && <LinksTable />}
            {type === "documents" && <DocumentsTable />}
            {type === "visitors" && <VisitorsTable />}
            {type === "views" && <ViewsTable />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
