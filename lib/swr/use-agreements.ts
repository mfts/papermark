import { useTeam } from "@/context/team-context";
import { Agreement } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export function useAgreements() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: agreements, error } = useSWR<(Agreement & { _count: { links: number } })[]>(
    teamId && `/api/teams/${teamId}/agreements`,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  return {
    agreements: agreements || [],
    loading: !agreements && !error,
    error,
  };
}
