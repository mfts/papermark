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

export default function useDatarooms() {
  const teamInfo = useTeam();

  const { data: datarooms, error } = useSWR<DataroomWithCount[]>(
    teamInfo?.currentTeam?.id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/datarooms`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    datarooms,
    loading: !datarooms && !error,
    error,
  };
}
