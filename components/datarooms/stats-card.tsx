import ErrorPage from "next/error";
import StatsElement from "@/components/documents/stats-element";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataroomStats } from "@/lib/swr/use-dataroom-stats";

export default function StatsCard() {
  const { stats, loading, error } = useDataroomStats();

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

  const statistics = [
    {
      name: "Number of visits",
      value: stats?.dataroomViews.length.toString() ?? "0",
      active: true,
    },
    {
      name: "Number of documents visits",
      value: stats?.documentViews.length.toString() ?? "0",
      active: true,
    },
    {
      name: "Total time spent",
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
      active: true,
    },
  ];

  return stats && stats.dataroomViews.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 border-foreground/5 space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-3">
      {statistics.map((stat, statIdx) => (
        <StatsElement key={statIdx} stat={stat} statIdx={statIdx} />
      ))}
    </div>
  ) : null;
}
