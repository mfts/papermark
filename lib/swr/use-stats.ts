import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { View } from "@prisma/client";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

import { fetcher } from "@/lib/utils";

export type TStatsData = {
  views: View[];
  groupedReactions: { type: string; _count: { type: number } }[];
  duration: {
    data: { versionNumber: number; pageNumber: string; avg_duration: number }[];
  };
  total_duration: number;
  totalViews: number;
};

export type AnalyticsFilters = {
  excludeTeamMembers?: boolean;
  includeLinks?: string;
  filterByViewer?: string;
  excludeLinks?: string;
  excludeViewers?: string;
};

export function useStats(filters: AnalyticsFilters = {}) {
  // this gets the data for a document's graph of all views
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { id } = router.query as {
    id: string;
  };

  const queryParams = new URLSearchParams();

  if (filters.excludeTeamMembers) {
    queryParams.append("excludeTeamMembers", "true");
  }
  if (filters.includeLinks) {
    queryParams.append("includeLinks", filters.includeLinks);
  }
  if (filters.filterByViewer) {
    queryParams.append("filterByViewer", filters.filterByViewer);
  }
  if (filters.excludeLinks) {
    queryParams.append("excludeLinks", filters.excludeLinks);
  }
  if (filters.excludeViewers) {
    queryParams.append("excludeViewers", filters.excludeViewers);
  }

  const queryString = queryParams.toString();
  const urlSuffix = queryString ? `?${queryString}` : "";
  console.log('urlSuffix', urlSuffix);
  const { data: stats, error } = useSWR<TStatsData>(
    id &&
      teamId &&
    `/api/teams/${teamId}/documents/${encodeURIComponent(id)}/stats${urlSuffix}`,
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
