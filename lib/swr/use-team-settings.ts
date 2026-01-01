import useSWR, { mutate } from "swr";

import { fetcher } from "@/lib/utils";

interface TeamSettings {
  replicateDataroomFolders: boolean;
  enableExcelAdvancedMode: boolean;
  timezone: string;
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

  const updateTimezone = async (timezone: string) => {
    if (!teamId) return;

    const response = await fetch(`/api/teams/${teamId}/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timezone }),
    });

    if (!response.ok) {
      throw new Error("Failed to update timezone");
    }

    // Revalidate the settings
    mutate(`/api/teams/${teamId}/settings`);

    return response.json();
  };

  return {
    settings: data,
    isLoading: !data && !error,
    isError: error,
    isValidating,
    updateTimezone,
  };
}
