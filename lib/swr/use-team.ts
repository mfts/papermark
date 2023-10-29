import useSWR from "swr";
import { useTeam } from "@/context/team-context";
import { fetcher } from "@/lib/utils";
import { TeamDetail } from "@/lib/types";

export function useGetTeam() {
  const teamInfo = useTeam();

  if (!teamInfo?.currentTeam?.id) {
    return;
  }

  const { data: team, error } = useSWR<TeamDetail>(
    `/api/teams/${teamInfo?.currentTeam?.id}`,
    fetcher,
    {
      dedupingInterval: 10000,
    }
  );

  return {
    team,
    loading: team ? false : true,
    error,
  };
}
