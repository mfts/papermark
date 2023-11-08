import { useStats } from "@/lib/swr/use-stats";
import ErrorPage from "next/error";
import BarChartComponent from "../charts/bar-chart";


export default function StatsChart({
  documentId,
  totalPages = 0,
}: {
  documentId: string;
  totalPages?: number;
}) {
  const { stats, loading, error } = useStats();

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (loading) {
    return <div>No data</div>;
  }

  let durationData = {
    data: Array.from({ length: totalPages }, (_, i) => ({
      pageNumber: (i + 1).toString(),
      avg_duration: 0,
    })),
  };

  const swrData = stats?.duration;

  durationData.data = durationData.data.map((item) => {
    const swrItem = swrData?.data.find(
      (data) => data.pageNumber === item.pageNumber
    );
    return swrItem ? swrItem : item;
  });

  return stats && stats.views.length > 0 ? (
    <div className="p-5">
      <BarChartComponent data={durationData.data} />
    </div>
  ) : null;
}
