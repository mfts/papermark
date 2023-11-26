import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Domain } from "@prisma/client";
import { useTeam } from "@/context/team-context";

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
