import { useStats } from "@/lib/swr/use-stats";
import ErrorPage from "next/error";
import StatsElement from "./stats-element";
import StatsCardSkeleton from "../skeletons/stats-card-skeleton";
import { BarChart3, ThumbsUp, TimerIcon } from "lucide-react";

export default function StatsCard() {
  const { stats, loading, error } = useStats();

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 border-foreground/5 space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const groupedReactionsTotal =
    stats?.groupedReactions
      .reduce((accumulator, item) => {
        return accumulator + item._count.type;
      }, 0)
      .toString() ?? "0";

  const statistics = [
    {
      name: "Number of visits",
      icon: BarChart3,
      value: stats?.views.length.toString() ?? "0",
      active: true,
    },
    {
      name: "Number of reactions",
      icon: ThumbsUp,
      value: groupedReactionsTotal,
      active: true,
    },
    {
      name: "Total average view duration",
      icon: TimerIcon,
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
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 border-foreground/5 space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-3">
      {statistics.map((stat, statIdx) => (
        <StatsElement key={statIdx} stat={stat} statIdx={statIdx} />
      ))}
    </div>
  ) : null;
}
