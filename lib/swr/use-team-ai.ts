import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

interface TeamAISettings {
  agentsEnabled: boolean;
  vectorStoreId: string | null;
  isAdmin: boolean;
  isAIFeatureEnabled: boolean;
}

/**
 * Hook to check team AI settings and user permissions
 * Returns whether AI is feature-flagged for the team,
 * whether it's enabled, and if the current user is an admin
 */
export function useTeamAI() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data, isLoading, mutate } = useSWR<TeamAISettings>(
    teamId ? `/api/teams/${teamId}/ai-settings` : null,
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    // Feature flag - is AI available for this team?
    isAIFeatureEnabled: data?.isAIFeatureEnabled ?? false,
    // Team setting - is AI enabled for this team?
    isAIEnabled: data?.agentsEnabled ?? false,
    // Is the current user an admin?
    isAdmin: data?.isAdmin ?? false,
    // Can the user manage AI settings? (admin + feature enabled)
    canManageAI: (data?.isAdmin && data?.isAIFeatureEnabled) ?? false,
    // Is the feature ready to use? (feature enabled + team enabled)
    canUseAI: (data?.isAIFeatureEnabled && data?.agentsEnabled) ?? false,
    // Vector store ID
    vectorStoreId: data?.vectorStoreId ?? null,
    // Loading state
    isLoading,
    // Mutate function to refresh AI settings
    mutateAISettings: mutate,
  };
}
