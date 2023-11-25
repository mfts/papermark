import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Dataroom } from "@prisma/client";

export function useDataroom() {
  const router = useRouter();

  const { dataroomId, authenticationCode } = router.query as {
    dataroomId: string;
    authenticationCode: string | undefined;
  };

  // only fetch data once when dataroomId is present
  const { data: dataroom, error } = useSWR<Dataroom>(
    dataroomId && `/api/datarooms?id=${encodeURIComponent(dataroomId)}`,
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