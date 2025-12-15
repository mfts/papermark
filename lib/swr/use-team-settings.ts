import useSWR from "swr";

import { fetcher } from "@/lib/utils";

interface TeamSettings {
  replicateDataroomFolders: boolean;
  enableExcelAdvancedMode: boolean;
}

/**
 * Hook to fetch fresh team settings with proper revalidation.
 * Useful when you need to ensure settings are up-to-date across tabs.
 */
export function useTeamSettings(teamId: string | undefined | null) {
  const { data, error, isValidating } = useSWR<TeamSettings>(
    teamId ? `/api/teams/${teamId}/settings` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Short deduping for settings
    },
  );

  return {
    settings: data,
    isLoading: !data && !error,
    isError: error,
    isValidating,
  };
}
