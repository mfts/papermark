import { Progress } from "@/components/ui/progress";
import ErrorPage from "next/error";
import { useDocumentProcessingStatus } from "@/lib/swr/use-document";
import { useEffect, useState } from "react";
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

  // const { status, loading, error: DocError } =
  //   useDocumentProcessingStatus(documentVersionId);

  // const [progress, setProgress] = useState<number>(0);
  // const [text, setText] = useState<string>("");

  // useEffect(() => {
  //   if (status) {
  //     const progress = (status.currentPageCount / status.totalPages) * 100;
  //     setProgress(progress);
  //     if (progress === 100) {
  //       setText("Processing complete");
  //     } else {
  //       setText(
  //         `${status.currentPageCount} / ${status.totalPages} pages processed`,
  //       );
  //     }
  //   }
  // }, [status]);

  // if (error && error.status === 404) {
  //   return <ErrorPage statusCode={404} />;
  // }

  if (fetchStatus === "loading") {
    return (
      <Progress value={0} className={cn("w-full rounded-none", className)} />
    );
  }

  if (fetchStatus === "error") {
    return (
      <Progress
        value={0}
        text={error.message}
        className={cn("w-full rounded-none", className)}
      />
    );
  }

  if (run.status === "SUCCESS") {
    return null;
  }

  console.log("statuses", statuses);

  console.log(
    "status",
    statuses[0].key,
    statuses[0].data?.progress,
    statuses[0].data?.text,
  );
  const progress = Number(statuses[0].data?.progress) * 100 || 0;
  const text = String(statuses[0].data?.text) || "";

  return (
    <Progress
      value={progress}
      text={text}
      className={cn(
        "w-full text-[8px] font-semibold capitalize rounded-none",
        className,
      )}
    />
  );
}
