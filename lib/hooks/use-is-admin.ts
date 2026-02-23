import { useSession } from "next-auth/react";

import { useGetTeam } from "@/lib/swr/use-team";
import { CustomUser } from "@/lib/types";

/**
 * Returns whether the current user is an Admin of the active team.
 * Relies on `useGetTeam()` (SWR-cached) so it won't cause extra fetches
 * when the team data is already loaded on a settings page.
 */
export function useIsAdmin() {
  const { data: session, status } = useSession();
  const { team, loading: teamLoading } = useGetTeam();

  const sessionLoading = status === "loading";
  const loading = teamLoading || sessionLoading;

  const userId = (session?.user as CustomUser)?.id;

  const isAdmin = !loading &&
    !!team?.users?.some(
      (u) => u.userId === userId && u.role === "ADMIN",
    );

  return { isAdmin, loading };
}
