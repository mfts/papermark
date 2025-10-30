import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import StatsCard from "./stats-card";
import StatsChartDummy from "./stats-chart-dummy";

interface DocumentStatsPlaceholderProps {
  numPages: number;
  onCreateLink: () => void;
}

export default function DocumentStatsPlaceholder({
  numPages,
  onCreateLink,
}: DocumentStatsPlaceholderProps) {
  // Mock stats data for placeholder
  const mockStatsData = {
    stats: undefined,
    loading: false,
    error: null,
  };

  return (
    <>
      <div className="flex items-center justify-end space-x-2">
        <Switch disabled={true} id="toggle-stats-placeholder" checked={false} />
        <Label
          htmlFor="toggle-stats-placeholder"
          className="text-muted-foreground"
        >
          Exclude internal views
        </Label>
      </div>

      {/* Stats Chart Placeholder */}
      <StatsChartDummy totalPagesMax={numPages} />

      {/* Stats Card Placeholder */}
      <div className="grid grid-cols-1 space-y-2 border-foreground/5 sm:grid-cols-3 sm:space-x-2 sm:space-y-0 lg:grid-cols-3 lg:space-x-3">
        {[
          { name: "Number of views", value: "0", active: false },
          { name: "Average view completion", value: "%", active: false },
          {
            name: "Total average view duration",
            value: "0",
            unit: "seconds",
            active: false,
          },
        ].map((stat, statIdx) => (
          <div
            key={statIdx}
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
    </>
  );
}
