import { useStats } from "@/lib/swr/use-stats";
import ErrorPage from "next/error";
import BarChartComponent from "../charts/bar-chart";


export default function StatsChart({
  documentId,
  totalPagesMax = 0,
}: {
  documentId: string;
  totalPagesMax?: number;
}) {
  const { stats, error } = useStats();

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (!stats?.duration.data) {
    return <div>No data</div>;
  }

  let durationData = {
    data: Array.from({ length: totalPagesMax }, (_, i) => ({
      pageNumber: (i + 1).toString(),
      avg_duration: 0,
    })),
  };

  const swrData = stats?.duration;

  durationData.data = durationData.data.flatMap((item) => {
    return swrData.data
      .filter((data) => data.pageNumber === item.pageNumber)
      .map((data) => ({
        versionNumber: data.versionNumber,
        pageNumber: item.pageNumber,
        avg_duration: data.avg_duration,
      }));
  });

  console.log("durationData.data", durationData.data);

  // durationData.data = durationData.data.map((item) => {
  //   const swrItem = swrData.data.find(
  //     (data) => data.pageNumber === item.pageNumber
  //   );
  //   return swrItem ? swrItem : item;
  // });

  return (
    <div className="p-5">
      <BarChartComponent data={durationData.data} />
    </div>
  );
}
