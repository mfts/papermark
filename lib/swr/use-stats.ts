import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { View } from "@prisma/client";
import { useTeam } from "@/context/team-context";

interface GroupedView {
  viewerEmail: string;
  _count: { id: number };
}

interface StatsData {
  views: View[];
  groupedViews: GroupedView[];
  duration: {
    data: { versionNumber: number; pageNumber: string; avg_duration: number }[];
  };
  total_duration: number;
}

export function useStats() {
  // this gets the data for a document's graph of all views
  const router = useRouter();
  const teamInfo = useTeam();

  const { id } = router.query as {
    id: string;
  };

  const { data: stats, error } = useSWR<StatsData>(
    id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
        id,
      )}/stats`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
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
  const teamInfo = useTeam();

  const { id: documentId } = router.query as {
    id: string;
  };

  const { data: stats, error } = useSWR<StatsViewData>(
    documentId &&
      viewId &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
        documentId,
      )}/views/${encodeURIComponent(viewId)}/stats`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    stats,
    loading: !error && !stats,
    error,
  };
}
