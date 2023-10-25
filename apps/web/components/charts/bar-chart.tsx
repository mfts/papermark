import { BarChart } from "@tremor/react";

const timeFormatter = (number: number) => {
  const totalSeconds = Math.floor(number / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);

  // Adding zero padding if seconds less than 10
  const secondsFormatted = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${minutes}:${secondsFormatted}`;
};

const renameAvgDurationKey = (data: any[]) => {
  return data.map((item) => {
    return {
      ...item,
      "Time spent per page": item.avg_duration,
      avg_duration: undefined,
    };
  });
};

const renameSumDurationKey = (data: any[]) => {
  return data.map((item) => {
    return {
      ...item,
      "Time spent per page": item.sum_duration,
      sum_duration: undefined,
    };
  });
};

export default function BarChartComponent({data, isSum = false}: {data: any, isSum?: boolean}) {
  const renamedData = isSum ? renameSumDurationKey(data) : renameAvgDurationKey(data);
  
  return (
    <BarChart
      className="mt-6 rounded-tremor-small"
      data={renamedData}
      index="pageNumber"
      categories={["Time spent per page"]}
      colors={["emerald"]}
      valueFormatter={timeFormatter}
      yAxisWidth={50}
      showGridLines={false}
    />
  );
}
