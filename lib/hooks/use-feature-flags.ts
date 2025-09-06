import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { BetaFeatures } from "@/lib/featureFlags";
import { fetcher } from "@/lib/utils";

/**
 * Hook to fetch and use feature flags for the current team
 */
export function useFeatureFlags() {
  const teamInfo = useTeam();

  const {
    data: features,
    error,
    isLoading,
  } = useSWR<Record<BetaFeatures, boolean>>(
    teamInfo?.currentTeam?.id
      ? `/api/feature-flags?teamId=${teamInfo.currentTeam.id}`
      : null,
    fetcher,
  );

  return {
    features,
    isLoading,
    error,
    // Helper function to check if a specific feature is enabled
    isFeatureEnabled: (feature: BetaFeatures) => features?.[feature] || false,
  };
}
