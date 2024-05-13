import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useEventRunStatuses } from "@trigger.dev/react";

export default function ProcessStatusBar({
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
        text="Processing document..."
        className={cn(
          "w-full text-[8px] font-semibold rounded-none",
          className,
        )}
      />
    );
  }

  if (fetchStatus === "error") {
    return (
      <Progress
        value={0}
        text={error.message}
        className={cn(
          "w-full text-[8px] font-semibold rounded-none",
          className,
        )}
      />
    );
  }

  if (run.status === "SUCCESS") {
    return null;
  }

  const progress = Number(statuses[0]?.data?.progress) * 100 || 0;
  const text = String(statuses[0]?.data?.text) || "";

  if (run.status === "FAILURE") {
    return (
      <Progress
        value={progress}
        text={`Error processing document page ${Number(statuses[0]?.data?.currentPage)}`}
        error={true}
        className={cn(
          "w-full text-[8px] font-semibold rounded-none",
          className,
        )}
      />
    );
  }

  return (
    <Progress
      value={progress}
      text={text}
      className={cn("w-full text-[8px] font-semibold rounded-none", className)}
    />
  );
}
