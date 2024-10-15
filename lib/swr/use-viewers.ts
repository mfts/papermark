import { useTeam } from "@/context/team-context";
import { Viewer } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export default function useViewers() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: viewers, error } = useSWR<Viewer[]>(
    teamId && `/api/teams/${teamId}/viewers`,
    fetcher,
  );

  return {
    viewers,
    loading: !viewers && !error,
    error,
  };
}
