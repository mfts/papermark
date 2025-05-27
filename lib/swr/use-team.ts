import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { TeamDetail } from "@/lib/types";
import { fetcher } from "@/lib/utils";

export function useGetTeam() {
  const { currentTeamId } = useTeam();

  const { data: team, error } = useSWR<TeamDetail>(
    currentTeamId && `/api/teams/${currentTeamId}`,
    fetcher,
    {
      dedupingInterval: 20000,
    },
  );

  return {
    team,
    loading: team ? false : true,
    error,
  };
}
