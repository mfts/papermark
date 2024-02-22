import { useVisitorStats } from "@/lib/swr/use-stats";
import ErrorPage from "next/error";
import BarChartComponent from "@/components/charts/bar-chart";
import StatsChartSkeleton from "../documents/stats-chart-skeleton";

export default function VisitorChart({
  documentId,
  viewId,
  totalPages = 0,
}: {
  documentId: string;
  viewId: string;
  totalPages?: number;
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
    <div className="pl-0.5 md:pl-1 pb-0.5 md:pb-1 border-l border-b rounded-bl-lg">
      <BarChartComponent data={durationData} isSum={true} />
    </div>
  );
}
