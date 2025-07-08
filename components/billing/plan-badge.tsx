import { CrownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export default function PlanBadge({
  plan,
  className,
}: {
  plan: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "ml-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal uppercase tracking-normal text-gray-700 ring-1 ring-gray-400 hover:bg-gray-200 dark:text-foreground dark:ring-gray-500 hover:dark:bg-gray-700",
        className,
      )}
    >
      <CrownIcon className="h-3 w-3" /> {plan}
    </span>
  );
}
