import BarChartComponent from "../charts/bar-chart";

export default function StatsChartDummy({
  totalPagesMax = 0,
}: {
  totalPagesMax?: number;
}) {
  let durationData = Array.from({ length: totalPagesMax }, (_, i) => ({
    pageNumber: (i + 1).toString(),
    data: [
      {
        versionNumber: 1,
        avg_duration: 16000 / (i + 1),
      },
    ],
  }));

  return (
    <div className="rounded-bl-lg border-b border-l pb-0.5 pl-0.5 md:pb-1 md:pl-1">
      <BarChartComponent data={durationData} isDummy />
    </div>
  );
}
