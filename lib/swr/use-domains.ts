import { useTeam } from "@/context/team-context";
import { Domain } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export function useDomains({ enabled = false }: { enabled?: boolean } = {}) {
  const teamInfo = useTeam();

  const { data: domains, error } = useSWR<Domain[]>(
    enabled && teamInfo?.currentTeam?.id
      ? `/api/teams/${teamInfo.currentTeam.id}/domains`
      : null,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  return {
    domains,
    loading: !domains && !error,
    error,
  };
}
