import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Logo } from "@prisma/client";
import { useTeam } from "@/context/team-context";

export function useLogo() {
  const teamInfo = useTeam();

  const { data: logo, error } = useSWR<Logo[]>(
    `/api/teams/${teamInfo?.currentTeam?.id}/logo`,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  return {
    logo,
    loading: !logo && !error,
    error,
  };
}
