import { CrownIcon } from "lucide-react";

export default function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs uppercase text-gray-700 ring-1 ring-gray-400 hover:bg-gray-200 dark:text-foreground dark:ring-gray-500 hover:dark:bg-gray-700">
      <CrownIcon className="h-3 w-3" /> {plan}
    </span>
  );
}
