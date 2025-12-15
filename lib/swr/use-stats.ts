import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { View } from "@prisma/client";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

import { fetcher } from "@/lib/utils";

export type TStatsData = {
  views: View[];
  avgCompletionRate: number;
  duration: {
    data: { versionNumber: number; pageNumber: string; avg_duration: number }[];
  };
  total_duration: number;
  totalViews: number;
};

export function useStats({
  excludeTeamMembers,
}: { excludeTeamMembers?: boolean } = {}) {
  // this gets the data for a document's graph of all views
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { id } = router.query as {
    id: string;
  };

  const { data: stats, error } = useSWR<TStatsData>(
    id &&
      teamId &&
      `/api/teams/${teamId}/documents/${encodeURIComponent(id)}/stats${excludeTeamMembers ? "?excludeTeamMembers=true" : ""}`,
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

export function useVisitorUserAgent(viewId: string) {
  const router = useRouter();
  const teamInfo = useTeam();

  const { id: documentId } = router.query as {
    id: string;
  };

  const { data: userAgent, error } = useSWRImmutable<{
    country: string;
    city: string;
    os: string;
    browser: string;
    device: string;
  }>(
    documentId &&
      viewId &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${documentId}/views/${viewId}/user-agent`,
    fetcher,
  );

  return {
    userAgent,
    loading: !error && !userAgent,
    error,
  };
}
