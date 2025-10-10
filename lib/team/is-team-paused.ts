import { Team } from "@prisma/client";

import prisma from "@/lib/prisma";

/**
 * Check if a team is currently paused
 * A team is considered paused if:
 * 1. pausedAt is set (team was paused)
 * 2. Current time is within the pause period (between pauseStartsAt and pauseEndsAt)
 */
export function isTeamPaused(
  team: Pick<Team, "pausedAt" | "pauseStartsAt" | "pauseEndsAt">,
): boolean {
  if (!team.pausedAt || !team.pauseStartsAt || !team.pauseEndsAt) {
    return false;
  }

  const now = new Date();
  const pauseStartsAt = new Date(team.pauseStartsAt);
  const pauseEndsAt = new Date(team.pauseEndsAt);

  // Team is paused if current time is within the pause period
  return now >= pauseStartsAt && now <= pauseEndsAt;
}

/**
 * Check if a team is currently paused (async version that fetches team data)
 */
export async function isTeamPausedById(teamId: string): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      pausedAt: true,
      pauseStartsAt: true,
      pauseEndsAt: true,
    },
  });

  if (!team) {
    return false;
  }

  return isTeamPaused(team);
}
