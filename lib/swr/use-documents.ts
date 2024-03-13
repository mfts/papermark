import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { useTeam } from "@/context/team-context";

export default function useDocuments() {
  const teamInfo = useTeam();

  const { data: documents, error } = useSWR<
    DocumentWithLinksAndLinkCountAndViewCount[]
  >(
    teamInfo?.currentTeam?.id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/documents`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    documents,
    loading: !documents && !error,
    error,
  };
}

export type FolderWithDocuments = Folder & {
  childFolders: FolderWithDocuments[];
  documents: {
    id: string;
    name: string;
    folderId: string;
  }[];
};

export function useFolders() {
  const teamInfo = useTeam();

  const { data: folders, error } = useSWR<FolderWithDocuments[]>(
    teamInfo?.currentTeam?.id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/folders`,
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
