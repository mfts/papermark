import { useRouter } from "next/router";

import { useMemo } from "react";

import { useTeam } from "@/context/team-context";
import { Brand, DataroomBrand } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

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

export function useDataroomBrand({
  dataroomId,
}: {
  dataroomId: string | undefined;
}) {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: brand, error } = useSWR<DataroomBrand>(
    teamId &&
      dataroomId &&
      `/api/teams/${teamId}/datarooms/${dataroomId}/branding`,
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
