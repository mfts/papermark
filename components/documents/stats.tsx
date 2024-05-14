import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useStats } from "@/lib/swr/use-stats";

import StatsCard from "./stats-card";
import StatsChart from "./stats-chart";

export const StatsComponent = ({
  documentId,
  numPages,
}: {
  documentId: string;
  numPages: number;
}) => {
  const [excludeTeamMembers, setExcludeTeamMembers] = useState<boolean>(false);
  const statsData = useStats({ excludeTeamMembers });

  return (
    <>
      <div className="flex items-center justify-end space-x-2">
        <Switch
          disabled={statsData.loading || statsData.error}
          id="toggle-stats"
          checked={excludeTeamMembers}
          onCheckedChange={setExcludeTeamMembers}
        />
        <Label
          htmlFor="toggle-stats"
          className={excludeTeamMembers ? "" : "text-muted-foreground"}
        >
          Exclude internal visits
        </Label>
      </div>

      {/* Stats Chart */}
      <StatsChart
        documentId={documentId}
        totalPagesMax={numPages}
        statsData={statsData}
      />

      {/* Stats Card */}
      <StatsCard statsData={statsData} />
    </>
  );
};
