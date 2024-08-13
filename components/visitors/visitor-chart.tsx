import ErrorPage from "next/error";

import BarChartComponent from "@/components/charts/bar-chart";

import { useVisitorStats } from "@/lib/swr/use-stats";

import StatsChartSkeleton from "../documents/stats-chart-skeleton";

export default function VisitorChart({
  documentId,
  viewId,
  totalPages = 0,
  versionNumber,
}: {
  documentId: string;
  viewId: string;
  totalPages?: number;
  versionNumber?: number;
}) {
  const { stats, error } = useVisitorStats(viewId);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (!stats?.duration.data) {
    return <StatsChartSkeleton />;
  }

  let durationData = Array.from({ length: totalPages }, (_, i) => ({
    pageNumber: (i + 1).toString(),
    sum_duration: 0,
  }));

  const swrData = stats?.duration;

  durationData = durationData.map((item) => {
    const swrItem = swrData.data.find(
      (data) => data.pageNumber === item.pageNumber,
    );
    return swrItem ? swrItem : item;
  });

  return (
    <div className="rounded-bl-lg border-b border-l pb-0.5 pl-0.5 md:pb-1 md:pl-1">
      <BarChartComponent
        data={durationData}
        isSum={true}
        versionNumber={versionNumber}
      />
    </div>
  );
}
