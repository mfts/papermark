import { Button } from "@/components/ui/button";

import VideoChartPlaceholder from "./video-chart-placeholder";

interface VideoStatsPlaceholderProps {
  length: number;
  onCreateLink: () => void;
}

export default function VideoStatsPlaceholder({
  length,
  onCreateLink,
}: VideoStatsPlaceholderProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const mockStats = [
    {
      name: "Total visits",
      value: "0",
      active: false,
    },
    {
      name: "Watch time",
      value: "0:00",
      unit: "minutes",
      active: false,
    },
    {
      name: "Average view duration",
      value: "0:00",
      unit: "minutes",
      active: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Video Chart Placeholder */}
      <VideoChartPlaceholder length={length} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockStats.map((stat, index) => (
          <div
            key={stat.name}
            className="rounded-lg border border-foreground/5 px-4 py-6 sm:px-6 lg:px-8"
          >
            <dt className="text-sm font-medium text-gray-500">{stat.name}</dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-gray-400">
                {stat.value}
                {stat.unit && (
                  <span className="ml-2 text-sm font-medium text-gray-300">
                    {stat.unit}
                  </span>
                )}
              </div>
            </dd>
          </div>
        ))}
      </div>
    </div>
  );
}
