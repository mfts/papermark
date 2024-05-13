import { useTeam } from "@/context/team-context";
import { Domain } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export function useDomains() {
  const teamInfo = useTeam();

  const { data: domains, error } = useSWR<Domain[]>(
    `/api/teams/${teamInfo?.currentTeam?.id}/domains`,
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
