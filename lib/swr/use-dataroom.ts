import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { DataroomWithFiles } from "../types";

export function usePagedDataroom() {
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
      dedupingInterval: 30000,
    },
  );

  return {
    dataroom: dataroom as DataroomWithFiles,
    loading: !error && !dataroom,
    error,
    authenticationCode,
  };
}
