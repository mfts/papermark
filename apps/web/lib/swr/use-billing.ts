import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { useMemo } from "react";

interface BillingProps {
  id: string;
  plan: string;
  startsAt: Date | null;
  endsAt: Date | null;
  subscriptionId: string | null;
  _count: {
    documents: number;
  };
}

export function useBilling() {
  const { data, error } = useSWR<BillingProps>(
    `/api/billing`,
    fetcher,
    {
      dedupingInterval: 30000,
    }
  );


  return {
    ...data,
    error,
    loading: !data && !error,
  };
}
