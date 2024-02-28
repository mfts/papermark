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
    <div className="pl-0.5 md:pl-1 pb-0.5 md:pb-1 border-l border-b rounded-bl-lg">
      <BarChartComponent data={durationData} isDummy />
    </div>
  );
}
