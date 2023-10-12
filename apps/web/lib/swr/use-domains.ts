import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { Domain } from "@prisma/client";

export function useDomains() {

  const { data: domains, error } = useSWR<Domain[]>(
    `/api/domains`,
    fetcher,
    {
      dedupingInterval: 60000,
    }
  );

  return {
    domains,
    loading: !domains && !error,
    error,
  };
}
