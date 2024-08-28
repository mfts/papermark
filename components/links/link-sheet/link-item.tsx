import PlanBadge from "@/components/billing/plan-badge";
import { Switch } from "@/components/ui/switch";

import { cn } from "@/lib/utils";

export default function LinkItem({
  title,
  enabled,
  action,
  isAllowed = true,
  requiredPlan,
  upgradeAction,
}: {
  title: string;
  enabled: boolean;
  action: () => void;
  isAllowed?: boolean;
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
          onClick={isAllowed ? action : () => upgradeAction?.()}
        >
          {title}
          {!isAllowed && requiredPlan && <PlanBadge plan={requiredPlan} />}
        </h2>
      </div>
      <Switch
        checked={enabled}
        onClick={isAllowed ? undefined : () => upgradeAction?.()}
        className={isAllowed ? undefined : "opacity-50"}
        onCheckedChange={isAllowed ? action : undefined}
      />
    </div>
  );
}
