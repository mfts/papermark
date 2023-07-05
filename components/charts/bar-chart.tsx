import { Card, Title, BarChart, Subtitle, BarList } from "@tremor/react";

const chartdata = [
  {
    name: "Amphibians",
    "Time spent per page": 2488,
  },
  {
    name: "Birds",
    "Time spent per page": 1445,
  },
  {
    name: "Crustaceans",
    "Time spent per page": 743,
  },
];

const dataFormatter = (number: number) => {
  return "$ " + Intl.NumberFormat("us").format(number).toString();
};

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

export default function BarChartComponent({data}: {data: any}) {
  const renamedData = renameAvgDurationKey(data);
  
  return (
    <BarChart
      className="mt-6 rounded-tremor-small"
      data={renamedData}
      index="pageNumber"
      categories={["Time spent per page"]}
      colors={["gray"]}
      valueFormatter={timeFormatter}
      yAxisWidth={50}
      showGridLines={false}
    />
  );}
