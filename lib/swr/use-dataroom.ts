import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Dataroom, DataroomFolder } from "@prisma/client";
import { FolderDirectory } from "@/lib/types"
import { DataroomWithFiles } from "@/lib/types";

export function useDataroom() {
  const router = useRouter();

  const { dataroomId, authenticationCode } = router.query as {
    dataroomId: string;
    authenticationCode: string | undefined;
  };

  // only fetch data once when dataroomId is present
  const { data: dataroom, error } = useSWR<DataroomWithFiles>(
    dataroomId && `/api/datarooms/paged?id=${encodeURIComponent(dataroomId)}`,
    fetcher,
    {
      dedupingInterval: 10000,
    }
  );

  return {
    dataroom,
    loading: !error && !dataroom,
    error,
    authenticationCode
  };
}

export function useHierarchicalDataroom() {
  const router = useRouter();

  const { dataroomId, authenticationCode, path } = router.query as {
    dataroomId: string;
    authenticationCode: string | undefined;
    path: string[]
  };

  const currentFolderId: string = path ?  path[path.length - 1] : "";

  // only fetch data once when dataroomId is present
  const { data, error } = useSWR<{dataroom: Dataroom,  folderDirectory: FolderDirectory, homeFolder: DataroomFolder}>(
    dataroomId && `/api/datarooms/hierarchical?id=${encodeURIComponent(dataroomId)}`,
    fetcher,
    {
      dedupingInterval: 10000,
    }
  );

  return {
    dataroom: data?.dataroom as Dataroom,
    folderDirectory: data?.folderDirectory as FolderDirectory,
    path: path as string[],
    currentFolderId, 
    loading: !error && !data,
    error,
    authenticationCode
  };
}