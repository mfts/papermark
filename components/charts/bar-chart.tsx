import { BarChart } from "@tremor/react";
import { useState } from "react";

type Data = {
  pageNumber: string; 
  data: { 
    versionNumber: number; 
    avg_duration: number; 
  }[]
};

type TransformedData = {
  pageNumber: string;
  [key: string]: number | string; // Adjusted type to accommodate version keys
};

type Color =
  | "neutral"
  | "emerald"
  | "gray"
  | "slate"
  | "zinc"
  | "stone"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose";

const timeFormatter = (number: number) => {
  const totalSeconds = Math.floor(number / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);

  // Adding zero padding if seconds less than 10
  const secondsFormatted = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${minutes}:${secondsFormatted}`;
};

// const renameAvgDurationKey = (data: any[]) => {
//   return data.map((item) => {
//     return {
//       ...item,
//       "Time spent per page": item.avg_duration,
//       avg_duration: undefined,
//     };
//   });
// };

const renameSumDurationKey = (data: any[]) => {
  return data.map((item) => {
    return {
      ...item,
      "Time spent per page": item.sum_duration,
      sum_duration: undefined,
    };
  });
};


// Transform data
const transformData = (data: Data[]): TransformedData[] => {
  return data.reduce((acc, { pageNumber, data }) => {
    const transformedItem: Partial<TransformedData> = { pageNumber };

    data.forEach(({ versionNumber, avg_duration }) => {
      transformedItem[`Version ${versionNumber}`] = avg_duration;
    })

    acc.push(transformedItem as TransformedData);
    return acc;
  }, [] as TransformedData[]);
};

const getVersionNumbers = (data: TransformedData[]) => {
  return [
    ...new Set(
      data.flatMap((item) =>
        Object.keys(item).filter((key) => key !== "pageNumber")
      )
    ),
  ];
};


const getColors = (versionNumbers: string[]): Color[] => {
  const colorArray = [
    "emerald",
    "teal",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
  ];
  return versionNumbers.map((versionNumber: string) => {
    const versionIndex = parseInt(versionNumber.split(" ")[1]) - 1;
    return colorArray[versionIndex % colorArray.length] as Color;
  });
};

export default function BarChartComponent({data, isSum = false}: {data: any, isSum?: boolean}) {
  const [, setValue] = useState<any>(null);

  const renamedData = isSum ? renameSumDurationKey(data) : transformData(data);
  // const transformedData = transformData(data);
  const versionNumbers = getVersionNumbers(renamedData);
  const colors = getColors(versionNumbers);

  console.log("renamedData", renamedData);
  console.log("versionNumbers", versionNumbers);
  console.log("colors", colors);
  
  return (
    <BarChart
      className="mt-6 rounded-tremor-small"
      data={renamedData}
      index="pageNumber"
      categories={versionNumbers}
      colors={colors}
      valueFormatter={timeFormatter}
      yAxisWidth={50}
      showGridLines={false}
      onValueChange={(v) => setValue(v)}
    />
  );
}
