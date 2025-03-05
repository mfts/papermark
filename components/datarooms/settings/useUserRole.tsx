import { useMemo } from "react";

import { useSession } from "next-auth/react";

import { USER_ROLE } from "@/components/team-role/user-role-modal";

import { useGetTeam } from "@/lib/swr/use-team";
import { CustomUser } from "@/lib/types";

export const useUserRole = (): USER_ROLE | null => {
  const { data: session } = useSession();
  const { team } = useGetTeam();

  return useMemo(() => {
    if (!session?.user || !team?.users) return null;

    const user = team.users.find(
      (u) => u.userId === (session.user as CustomUser)?.id,
    );

    return user?.role || null;
  }, [session, team]);
};
