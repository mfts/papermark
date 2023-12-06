import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Team } from "@/lib/types";
import { useSession } from "next-auth/react";

export function useTeams() {
  const router = useRouter();
  const { data: session } = useSession();

  const { data: teams, isValidating } = useSWR<Team[]>(
    router.isReady && session && "/api/teams",
    fetcher,
    {
      dedupingInterval: 20000,
    },
  );

  return {
    teams,
    loading: teams ? false : true,
    isValidating,
  };
}
