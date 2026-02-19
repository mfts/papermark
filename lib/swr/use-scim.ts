import { useTeam } from "@/context/team-context";
import type { Directory } from "@boxyhq/saml-jackson";
import useSWRImmutable from "swr/immutable";

import { fetcher } from "@/lib/utils";

export default function useSCIM(teamIdOverride?: string | null) {
  const { currentTeamId } = useTeam();
  const teamId = teamIdOverride ?? currentTeamId;

  const { data, error, isLoading, mutate } = useSWRImmutable<{
    directories: Directory[];
  }>(
    teamId ? `/api/teams/${teamId}/directory-sync` : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
      dedupingInterval: 60_000,
    },
  );

  const configured = !!(data?.directories && data.directories.length > 0);

  return {
    scim: data,
    directories: data?.directories ?? [],
    provider: configured ? data!.directories[0].type : null,
    configured,
    loading: isLoading && !data,
    error,
    mutate,
  };
}
