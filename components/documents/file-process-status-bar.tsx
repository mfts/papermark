import { useEffect, useState } from "react";

import useSWRImmutable from "swr/immutable";

import { Progress } from "@/components/ui/progress";

import { cn, fetcher } from "@/lib/utils";
import { useDocumentProgressStatus } from "@/lib/utils/use-progress-status";

const QUEUED_MESSAGES = [
  "Converting document...",
  "Optimizing for viewing...",
  "Preparing preview...",
  "Almost ready...",
];

export default function FileProcessStatusBar({
  documentVersionId,
  className,
  mutateDocument,
  onProcessingChange,
}: {
  documentVersionId: string;
  className?: string;
  mutateDocument: () => void;
  onProcessingChange?: (processing: boolean) => void;
}) {
  const [messageIndex, setMessageIndex] = useState(0);
  const { data } = useSWRImmutable<{ publicAccessToken: string }>(
    `/api/progress-token?documentVersionId=${documentVersionId}`,
    fetcher,
  );

  const { status: progressStatus, error: progressError } =
    useDocumentProgressStatus(documentVersionId, data?.publicAccessToken);

  // Update processing state whenever status changes
  useEffect(() => {
    if (onProcessingChange) {
      onProcessingChange(
        progressStatus.state === "QUEUED" ||
          progressStatus.state === "EXECUTING",
      );
    }
  }, [progressStatus.state, onProcessingChange]);

  // Cycle through messages when queued or executing
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (progressStatus.state === "QUEUED") {
      interval = setInterval(() => {
        setMessageIndex((current) => (current + 1) % QUEUED_MESSAGES.length);
      }, 5000); // Change message every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [progressStatus.state]);

  if (progressStatus.state === "QUEUED" && !progressError) {
    return (
      <Progress
        value={0}
        text={QUEUED_MESSAGES[messageIndex]}
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

  // For EXECUTING state
  return (
    <Progress
      value={progressStatus.progress || 0}
      text={progressStatus.text || "Processing document..."}
      className={cn("w-full rounded-none text-[8px] font-semibold", className)}
    />
  );
}
