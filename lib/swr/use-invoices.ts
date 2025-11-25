import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  created: number;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  periodStart: number;
  periodEnd: number;
  description: string;
}

export function useInvoices() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data, error, isLoading } = useSWR<{ invoices: Invoice[] }>(
    teamId ? `/api/teams/${teamId}/billing/invoices` : null,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    },
  );

  return {
    invoices: data?.invoices || [],
    loading: isLoading,
    error,
  };
}

