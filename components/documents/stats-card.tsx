import { useStats } from "@/lib/swr/use-stats";
import ErrorPage from "next/error";
import StatsElement from "./stats-element";
import StatsElementPlaceholder from "./stats-element-placeholder";

export default function StatsCard() {
  const { stats, loading, error } = useStats();

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 border-b border-foreground/5">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatsElementPlaceholder key={i} statIdx={i} />
        ))}
      </div>
    );
  }

  const statistics = [
    {
      name: "Number of visits",
      value: stats?.views.length.toString() ?? "0",
      active: true,
    },
    {
      name: "Number of unique visitors",
      value: stats?.groupedViews.length.toString() ?? "0",
      active: true,
    },
    {
      name: "Total avgerage view duration",
      value:
        stats?.total_duration == null
          ? "46"
          : stats?.total_duration < 60000
            ? `${Math.round(stats?.total_duration / 1000)}`
            : `${Math.floor(stats?.total_duration / 60000)}:${
                Math.round((stats?.total_duration % 60000) / 1000) < 10
                  ? `0${Math.round((stats?.total_duration % 60000) / 1000)}`
                  : Math.round((stats?.total_duration % 60000) / 1000)
              }`,
      unit: stats?.total_duration! < 60000 ? "seconds" : "minutes",
      active: stats?.total_duration ? true : false,
    },
  ];

  return stats && stats.views.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 border-b border-foreground/5">
      {statistics.map((stat, statIdx) => (
        <StatsElement key={statIdx} stat={stat} statIdx={statIdx} />
      ))}
    </div>
  ) : null;
}
