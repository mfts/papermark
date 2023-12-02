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
  const { stats, loading, error } = useStats();

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (loading) {
    return <div>No data</div>;
  }

  let durationData = Array.from({ length: totalPagesMax }, (_, i) => ({
    pageNumber: (i + 1).toString(),
    data: [
      {
        versionNumber: 1,
        avg_duration: 0,
      },
    ],
  }));

  const swrData = stats?.duration;

  if (swrData) {
    swrData.data.forEach((dataItem) => {
      const pageIndex = durationData.findIndex(
        (item) => item.pageNumber === dataItem.pageNumber,
      );

      if (pageIndex !== -1) {
        // If page exists in the initialized array, update its data
        const versionIndex = durationData[pageIndex].data.findIndex(
          (v) => v.versionNumber === dataItem.versionNumber,
        );
        if (versionIndex === -1) {
          // If this version number doesn't exist, add it
          durationData[pageIndex].data.push({
            versionNumber: dataItem.versionNumber,
            avg_duration: dataItem.avg_duration,
          });
        } else {
          // Update existing data for this version
          durationData[pageIndex].data[versionIndex] = {
            ...durationData[pageIndex].data[versionIndex],
            avg_duration: dataItem.avg_duration,
          };
        }
      } else {
        // If this page number doesn't exist, add it with the version data
        durationData.push({
          pageNumber: dataItem.pageNumber,
          data: [
            {
              versionNumber: dataItem.versionNumber,
              avg_duration: dataItem.avg_duration,
            },
          ],
        });
      }
    });

    // Sort by page number
    durationData.sort(
      (a, b) => parseInt(a.pageNumber) - parseInt(b.pageNumber),
    );
  }

  return stats && stats.views.length > 0 ? (
    <div className="p-5">
      <BarChartComponent data={durationData} />
    </div>
  ) : null;
}
