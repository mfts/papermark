import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "../utils";
import { ITeamDetail } from "../types";

export function useTeam() {
  const router = useRouter();

  const { id } = router.query as {
    id: string;
  };

  const { data: team, error } = useSWR<ITeamDetail>(
    router.isReady && `/api/teams/${encodeURIComponent(id)}`,
    fetcher,
    {
      dedupingInterval: 10000,
    }
  );

  return {
    team,
    loading: !error && !team,
    error,
  };
}
