import { useTeam } from "@/context/team-context";
import { useSession } from "next-auth/react";
import useSWR from "swr";

import { BetaFeatures } from "@/lib/featureFlags";
import { TeamDetail, CustomUser } from "@/lib/types";
import { fetcher } from "@/lib/utils";

interface TeamAISettings {
  agentsEnabled: boolean;
}

/**
 * Hook to check team AI settings and user permissions
 * Returns whether AI is feature-flagged for the team, 
 * whether it's enabled, and if the current user is an admin
 */
export function useTeamAI() {
  const { data: session } = useSession();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  // Fetch feature flags to check if AI is enabled for this team
  const { data: features, isLoading: featuresLoading } = useSWR<
    Record<BetaFeatures, boolean>
  >(teamId ? `/api/feature-flags?teamId=${teamId}` : null, fetcher, {
    dedupingInterval: 60000,
  });

  // Fetch team details to get agentsEnabled and user role
  const { data: team, isLoading: teamLoading } = useSWR<TeamDetail>(
    teamId ? `/api/teams/${teamId}` : null,
    fetcher,
    {
      dedupingInterval: 20000,
    },
  );

  // Fetch team AI settings
  const {
    data: aiSettings,
    isLoading: aiSettingsLoading,
    mutate: mutateAISettings,
  } = useSWR<TeamAISettings>(
    teamId ? `/api/teams/${teamId}/ai-settings` : null,
    fetcher,
    {
      dedupingInterval: 10000,
    },
  );

  const userId = (session?.user as CustomUser)?.id;

  // Check if current user is admin
  const isAdmin = team?.users.some(
    (user) => user.role === "ADMIN" && user.userId === userId,
  );

  // Check if AI feature is available for this team (via feature flags)
  const isAIFeatureEnabled = features?.ai ?? false;

  // Check if AI is enabled for this team (team setting)
  const isAIEnabled = aiSettings?.agentsEnabled ?? false;

  return {
    // Feature flag - is AI available for this team?
    isAIFeatureEnabled,
    // Team setting - is AI enabled for this team?
    isAIEnabled,
    // Is the current user an admin?
    isAdmin,
    // Can the user manage AI settings? (admin + feature enabled)
    canManageAI: isAdmin && isAIFeatureEnabled,
    // Is the feature ready to use? (feature enabled + team enabled)
    canUseAI: isAIFeatureEnabled && isAIEnabled,
    // Loading states
    isLoading: featuresLoading || teamLoading || aiSettingsLoading,
    // Mutate function to refresh AI settings
    mutateAISettings,
  };
}

