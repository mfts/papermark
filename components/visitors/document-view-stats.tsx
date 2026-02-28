import { useEffect, useRef, useState } from "react";

import { DownloadCloudIcon } from "lucide-react";

import BarChartComponent from "@/components/charts/bar-chart";
import StatsChartSkeleton from "@/components/documents/stats-chart-skeleton";

import { useDataroomDocumentPageStats } from "@/lib/swr/use-dataroom-view-document-stats";

export function DocumentPageChart({
  dataroomId,
  dataroomViewId,
  documentViewId,
  documentId,
  totalPages,
  downloadType,
  downloadMetadata,
}: {
  dataroomId: string;
  dataroomViewId: string;
  documentViewId: string;
  documentId: string;
  totalPages: number;
  downloadType?: "SINGLE" | "BULK" | "FOLDER" | null;
  downloadMetadata?: {
    folderName?: string;
    folderPath?: string;
    dataroomName?: string;
    documentCount?: number;
    documents?: { id: string; name: string }[];
  } | null;
}) {
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setFetchEnabled(true);
    }, 150);
    return () => clearTimeout(timerRef.current);
  }, []);

  const { duration, loading } = useDataroomDocumentPageStats({
    dataroomId,
    dataroomViewId,
    documentViewId,
    documentId,
    enabled: fetchEnabled,
  });

  if (loading || !duration) {
    return <StatsChartSkeleton className="border-none px-0" />;
  }

  const hasViewData = duration.data.some((item) => item.sum_duration > 0);

  if (!hasViewData && downloadType) {
    let downloadMessage = "";
    if (downloadType === "FOLDER" && downloadMetadata?.folderName) {
      downloadMessage = `Downloaded without viewing via folder "${downloadMetadata.folderName}"`;
    } else if (downloadType === "BULK") {
      downloadMessage = "Downloaded without viewing via bulk download";
    } else {
      downloadMessage = "Downloaded without viewing";
    }

    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <DownloadCloudIcon className="h-4 w-4" />
        <span>{downloadMessage}</span>
      </div>
    );
  }

  let durationData = Array.from({ length: totalPages }, (_, i) => ({
    pageNumber: (i + 1).toString(),
    sum_duration: 0,
  }));

  durationData = durationData.map((item) => {
    const match = duration.data.find((d) => d.pageNumber === item.pageNumber);
    return match || item;
  });

  return (
    <div className="pb-0.5 pl-0.5 md:pb-1 md:pl-1">
      <BarChartComponent data={durationData} isSum={true} documentId={documentId} />
    </div>
  );
}
