import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Team } from "@/lib/types";

export function useTeams() {
  const router = useRouter();

  const { data: teams, isValidating } = useSWR<Team[]>(
    router.isReady && "/api/teams",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    teams,
    loading: teams ? false : true,
    isValidating,
  };
}
