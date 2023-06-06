import { useStats } from "@/lib/swr/use-stats";
import ErrorPage from "next/error";
import StatsElement from "./stats-element";
import StatsElementPlaceholder from "./stats-element-placeholder";

export default function StatsCard() {
  const { stats, error } = useStats();

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  const statistics = [
    {
      name: "Number of views",
      value: stats?.views.length.toString() ?? "0",
      active: true,
    },
    {
      name: "Number of unique viewers",
      value: stats?.groupedViews.length.toString() ?? "0",
      active: true,
    },
    {
      name: "Average view duration",
      value: "3.65",
      unit: "mins",
      active: false,
    },
    { name: "TBD", value: "98.5%", active: false },
  ];

  return (
    <div className="grid grid-cols-1 bg-gray-700/10 sm:grid-cols-2 lg:grid-cols-4">
      {stats
        ? statistics.map((stat, statIdx) => (
            <StatsElement key={statIdx} stat={stat} statIdx={statIdx} />
          ))
        : Array.from({ length: 4 }).map((_, i) => (
            <StatsElementPlaceholder key={i} />
          ))}
    </div>
  );
}
