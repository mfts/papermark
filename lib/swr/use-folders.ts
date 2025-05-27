import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "../utils";

type FolderWithParents = {
  id: string;
  name: string;
  parentId: string | null;
  teamId: string;
  _count: {
    documents: number;
    childFolders: number;
  };
  parent: FolderWithParents | null;
};

export function useFolderWithParents({ name }: { name: string[] }) {
  const teamInfo = useTeam();

  const { data: folders, error } = useSWR<{ name: string; path: string }[]>(
    teamInfo?.currentTeam?.id &&
    name && !!name.length &&
      `/api/teams/${teamInfo?.currentTeam?.id}/folders/parents/${name.join("/")}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    folders,
    loading: !folders && !error,
    error,
  };
}
