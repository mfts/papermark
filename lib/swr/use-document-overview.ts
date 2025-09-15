import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { DocumentWithVersion } from "@/lib/types";
import { fetcher } from "@/lib/utils";

interface DocumentOverview {
  document: DocumentWithVersion & {
    hasPageLinks: boolean;
    isEmpty: boolean;
    primaryVersion: any;
  };
  limits: {
    canAddLinks: boolean;
    canAddDocuments: boolean;
    canAddUsers: boolean;
  };
  featureFlags: {
    annotations: boolean;
  };
  team: {
    plan: string;
    isTrial: boolean;
  };
  counts: {
    links: number;
    views: number;
  };
}

export function useDocumentOverview() {
  const router = useRouter();
  const teamInfo = useTeam();

  const { id } = router.query as {
    id: string;
  };

  const { data, error, mutate } = useSWR<DocumentOverview>(
    teamInfo?.currentTeam?.id &&
      id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents/${encodeURIComponent(
        id,
      )}/overview`,
    fetcher,
    {
      // Aggressive caching for fast loads
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      // Enable fast refresh for critical data
      refreshInterval: 0,
      onError: (err) => {
        if (err.status === 404) {
          router.replace("/documents");
        }
      },
    },
  );

  return {
    data,
    document: data?.document,
    primaryVersion: data?.document?.primaryVersion,
    limits: data?.limits,
    featureFlags: data?.featureFlags,
    team: data?.team,
    counts: data?.counts,
    isEmpty: data?.document?.isEmpty || false,
    loading: !error && !data,
    error,
    mutate,
  };
}
