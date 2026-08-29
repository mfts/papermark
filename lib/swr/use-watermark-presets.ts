import { WatermarkPreset } from "@prisma/client";

import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export function useWatermarkPresets() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const {
    data,
    isValidating,
    error,
    isLoading,
    mutate,
  } = useSWR<{ presets: WatermarkPreset[] }>(
    teamId && `/api/teams/${teamId}/watermark-presets`,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  return {
    presets: data?.presets,
    loading: data ? false : true,
    isValidating,
    error,
    isLoading,
    mutate,
  };
}
