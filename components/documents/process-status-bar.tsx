import { Progress } from "@/components/ui/progress";
import ErrorPage from "next/error";
import { useDocumentProcessingStatus } from "@/lib/swr/use-document";
import { useEffect, useState } from "react";

export default function ProcessStatusBar({
  documentVersionId,
}: {
  documentVersionId: string;
}) {
  const { status, loading, error } =
    useDocumentProcessingStatus(documentVersionId);

  const [progress, setProgress] = useState<number>(0);
  const [text, setText] = useState<string>("");

  useEffect(() => {
    if (status) {
      const progress = (status.currentPageCount / status.totalPages) * 100;
      setProgress(progress);
      if (progress === 100) {
        setText("Processing complete");
      } else {
        setText(
          `${status.currentPageCount} / ${status.totalPages} pages processed`,
        );
      }
    }
  }, [status]);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (loading) {
    return <Progress value={0} />;
  }

  return <Progress value={progress} text={text} className="w-[60%]" />;
}
