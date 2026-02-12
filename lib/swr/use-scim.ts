import { useTeam } from "@/context/team-context";
import type { Directory } from "@boxyhq/saml-jackson";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export default function useSCIM() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data, isLoading, mutate } = useSWR<{ directories: Directory[] }>(
    teamId ? `/api/teams/${teamId}/directory-sync` : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
    },
  );

  const configured = !!(data?.directories && data.directories.length > 0);

  return {
    scim: data,
    directories: data?.directories ?? [],
    provider: configured ? data!.directories[0].type : null,
    configured,
    loading: isLoading,
    mutate,
  };
}
