import { useTeam } from "@/context/team-context";
import { Dataroom } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export type DataroomWithCount = Dataroom & {
  _count: {
    documents: number;
    views: number;
  };
};

export default function useArchivedDatarooms() {
  const teamInfo = useTeam();

  const { data: archivedDatarooms, error } = useSWR<DataroomWithCount[]>(
    teamInfo?.currentTeam?.id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/archived`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    archivedDatarooms,
    loading: !archivedDatarooms && !error,
    error,
  };
}
