import { TStatsData } from "@/lib/swr/use-stats";
import ErrorPage from "next/error";
import StatsElement from "./stats-element";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsCard({
  statsData,
}: {
  statsData: { stats: TStatsData | undefined; loading: boolean; error: any };
}) {
  const { stats, loading, error } = statsData;

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 border-foreground/5 space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            className="border border-foreground/5 py-6 px-4 sm:px-6 lg:px-8 rounded-lg"
            key={i}
          >
            <Skeleton className="h-6 w-[80%] rounded-sm" />
            <Skeleton className="mt-4 h-8 w-9" />
          </div>
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
      value: stats?.totalViews.toString() ?? "0",
      active: true,
    },
    {
      name: "Number of reactions",
      value: groupedReactionsTotal,
      active: true,
    },
    {
      name: "Total average view duration",
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
