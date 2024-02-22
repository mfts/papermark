import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { DataroomWithFilesAndFolders } from "@/lib/types";
import { useTeam } from "@/context/team-context";

export interface DataroomWithFilesFoldersAndFilesCount
  extends DataroomWithFilesAndFolders {
  _count: {
    files: number;
  };
}

export default function useDatarooms() {
  const teamInfo = useTeam();
  const { data: datarooms, error } = useSWR<
    DataroomWithFilesFoldersAndFilesCount[]
  >(
    teamInfo?.currentTeam?.id &&
      `/api/datarooms?teamId=${teamInfo?.currentTeam?.id}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    },
  );

  return {
    datarooms,
    loading: !datarooms && !error,
    error,
  };
}
