import useSWR from "swr";
import { useTeam } from "@/context/team-context";
import { fetcher } from "@/lib/utils";
import { TeamDetail } from "@/lib/types";

export function useGetTeam() {
  const teamInfo = useTeam();

  const { data: team, error } = useSWR<TeamDetail>(
    teamInfo?.currentTeam && `/api/teams/${teamInfo.currentTeam.id}`,
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
