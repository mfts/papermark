import { useQueryState } from "nuqs";

import { useDocumentAnalyticsFilters } from "@/lib/swr/use-document-analytics-filters";
import { AnalyticsFilters, useStats } from "@/lib/swr/use-stats";

import AnalyticsFiltersComponent from "./analytics-filters";
import StatsCard from "./stats-card";
import StatsChart from "./stats-chart";

export const StatsComponent = ({
  documentId,
  numPages,
}: {
  documentId: string;
  numPages: number;
}) => {
  const [excludeInternal] = useQueryState("excludeInternal", {
    defaultValue: false,
    parse: (value) => value === "true",
    serialize: (value) => value.toString(),
  });

  const [includeLinks] = useQueryState("includeLinks", {
    defaultValue: "",
  });

  const [filterByViewer] = useQueryState("filterByViewer", {
    defaultValue: "",
  });

  const [excludeLinks] = useQueryState("excludeLinks", {
    defaultValue: "",
  });

  const [excludeViewers] = useQueryState("excludeViewers", {
    defaultValue: "",
  });

  const filters: AnalyticsFilters = {
    excludeTeamMembers: excludeInternal,
    includeLinks: includeLinks || undefined,
    filterByViewer: filterByViewer || undefined,
    excludeLinks: excludeLinks || undefined,
    excludeViewers: excludeViewers || undefined,
  };

  const statsData = useStats(filters);

  const { data: filterData, loading: filterDataLoading } =
    useDocumentAnalyticsFilters(includeLinks);

  return (
    <>
      {/* Analytics Filters */}
      <AnalyticsFiltersComponent
        documentId={documentId}
        availableLinks={filterData?.availableLinks || []}
        availableViewers={filterData?.availableViewers || []}
      />

      {/* Stats Chart */}
      <StatsChart
        documentId={documentId}
        totalPagesMax={numPages}
        statsData={statsData}
      />

      {/* Stats Card */}
      <StatsCard statsData={statsData} />
    </>
  );
};
