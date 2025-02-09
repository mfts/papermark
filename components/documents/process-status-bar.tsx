import { useEventRunStatuses } from "@trigger.dev/react";

import { Progress } from "@/components/ui/progress";

import { cn } from "@/lib/utils";

export default function FileProcessStatusBar({
  documentVersionId,
  className,
}: {
  documentVersionId: string;
  className?: string;
}) {
  const { fetchStatus, error, statuses, run } =
    useEventRunStatuses(documentVersionId);

  if (fetchStatus === "loading") {
    return (
      <Progress
        value={0}
        text="Processing file..."
        className={cn(
          "w-full rounded-none text-[8px] font-semibold",
          className,
        )}
      />
    );
  }

  if (fetchStatus === "error") {
    return (
      <Progress
        value={0}
        text={error?.message || "Error processing file"}
        error={true}
        className={cn(
          "w-full rounded-none text-[8px] font-semibold",
          className,
        )}
      />
    );
  }

  if (run.status === "SUCCESS") {
    return null;
  }

  const progress = Number(statuses[0]?.data?.progress) * 100 || 0;
  const text = String(statuses[0]?.data?.text) || "Processing file...";

  if (run.status === "FAILURE") {
    return (
      <Progress
        value={progress}
        text="Error processing file"
        error={true}
        className={cn(
          "w-full rounded-none text-[8px] font-semibold",
          className,
        )}
      />
    );
  }

  return (
    <Progress
      value={progress}
      text={text}
      className={cn("w-full rounded-none text-[8px] font-semibold", className)}
    />
  );
}
