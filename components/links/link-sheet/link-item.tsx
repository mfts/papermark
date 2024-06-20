import PlanBadge from "@/components/billing/plan-badge";
import { Switch } from "@/components/ui/switch";

import { cn } from "@/lib/utils";

import { LinkUpgradeOptions } from "./link-options";

export default function LinkItem({
  title,
  enabled,
  action,
  hasFreePlan,
  requiredPlan,
  upgradeAction,
}: {
  title: string;
  enabled: boolean;
  action: () => void;
  hasFreePlan?: boolean;
  requiredPlan?: string;
  upgradeAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center justify-between space-x-2">
        <h2
          className={cn(
            "cursor-pointer text-sm font-medium leading-6",
            enabled ? "text-foreground" : "text-muted-foreground",
          )}
          onClick={hasFreePlan ? () => upgradeAction?.() : action}
        >
          {title}
          {hasFreePlan && requiredPlan && <PlanBadge plan={requiredPlan} />}
        </h2>
      </div>
      <Switch
        checked={enabled}
        onClick={hasFreePlan ? () => upgradeAction?.() : undefined}
        className={hasFreePlan ? "opacity-50" : undefined}
        onCheckedChange={hasFreePlan ? undefined : action}
      />
    </div>
  );
}
