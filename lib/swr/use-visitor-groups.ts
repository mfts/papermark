import { useTeam } from "@/context/team-context";
import { VisitorGroup } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export type VisitorGroupWithCount = VisitorGroup & {
  _count: {
    links: number;
  };
};

export default function useVisitorGroups() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const {
    data: visitorGroups,
    error,
    mutate,
  } = useSWR<VisitorGroupWithCount[]>(
    teamId ? `/api/teams/${teamId}/visitor-groups` : null,
    fetcher,
    { dedupingInterval: 30000 },
  );

  return {
    visitorGroups,
    loading: !visitorGroups && !error,
    error,
    mutate,
  };
}
