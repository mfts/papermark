import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { useMemo } from "react";
import { useTeam } from "@/context/team-context";
import { Brand } from "@prisma/client";

export function useBrand() {
  const teamInfo = useTeam();

  const { data: brand, error } = useSWR<Brand>(
    teamInfo?.currentTeam?.id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/branding`,
    fetcher,
    {
      dedupingInterval: 30000,
    },
  );

  return {
    brand,
    error,
    loading: !brand && !error,
  };
}
