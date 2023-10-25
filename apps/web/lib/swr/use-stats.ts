import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { View } from "@prisma/client";

interface GroupedView {
  viewerEmail: string;
  _count: { id: number };
}

interface StatsData {
  views: View[];
  groupedViews: GroupedView[];
  duration: {
    data: { pageNumber: string; avg_duration: number }[];
  };
  total_duration: number;
}

export function useStats() {
  // this gets the data for a document's graph of all views
  const router = useRouter();

  const { id } = router.query as {
    id: string;
  };

  const { data: stats, error } = useSWR<StatsData>(
    id && `/api/documents/${encodeURIComponent(id)}/stats`,
    fetcher,
    {
      dedupingInterval: 10000,
    }
  );

  return {
    stats,
    loading: !error && !stats,
    error,
  };
}

interface StatsViewData {
  views: View[];
  duration: {
    data: { pageNumber: string; sum_duration: number }[];
  };
}

export function useVisitorStats(viewId: string) {
  // this gets the data for a single visitor's graph
  const router = useRouter();

  const { id: documentId } = router.query as {
    id: string;
  };

  const { data: stats, error } = useSWR<StatsViewData>(
    documentId &&
      viewId &&
      `/api/documents/${encodeURIComponent(documentId)}/views/${encodeURIComponent(
        viewId
      )}/stats`,
    fetcher,
    {
      dedupingInterval: 10000,
    }
  );

  return {
    stats,
    loading: !error && !stats,
    error,
  };
}