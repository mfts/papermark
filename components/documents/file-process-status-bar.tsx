import useSWRImmutable from "swr/immutable";

import { Progress } from "@/components/ui/progress";

import { cn, fetcher } from "@/lib/utils";
import { useDocumentProgressStatus } from "@/lib/utils/use-progress-status";

export default function FileProcessStatusBar({
  documentVersionId,
  className,
  mutateDocument,
}: {
  documentVersionId: string;
  className?: string;
  mutateDocument: () => void;
}) {
  const { data } = useSWRImmutable<{ publicAccessToken: string }>(
    `/api/progress-token?documentVersionId=${documentVersionId}`,
    fetcher,
  );

  const { status: progressStatus, error: progressError } =
    useDocumentProgressStatus(documentVersionId, data?.publicAccessToken);

  if (progressStatus.state === "QUEUED") {
    return (
      <Progress
        value={0}
        text="Processing document..."
        className={cn(
          "w-full rounded-none text-[8px] font-semibold",
          className,
        )}
      />
    );
  }

  if (
    progressError ||
    ["FAILED", "CRASHED", "CANCELED", "SYSTEM_FAILURE"].includes(
      progressStatus.state,
    )
  ) {
    return (
      <Progress
        value={0}
        text={
          progressError?.message ||
          progressStatus.text ||
          "Error processing document"
        }
        error={true}
        className={cn(
          "w-full rounded-none text-[8px] font-semibold",
          className,
        )}
      />
    );
  }

  if (progressStatus.state === "COMPLETED") {
    mutateDocument();
    return null;
  }

  return (
    <Progress
      value={progressStatus.progress || 0}
      text={progressStatus.text || "Processing document..."}
      className={cn("w-full rounded-none text-[8px] font-semibold", className)}
    />
  );
}
