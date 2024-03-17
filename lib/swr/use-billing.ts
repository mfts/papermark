import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { useMemo } from "react";
import { useTeam } from "@/context/team-context";

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
  const teamInfo = useTeam();

  const { data, error } = useSWR<BillingProps>(
    teamInfo?.currentTeam && `/api/teams/${teamInfo.currentTeam.id}/billing`,
    fetcher,
    {
      dedupingInterval: 30000,
    },
  );

  return {
    ...data,
    error,
    loading: !data && !error,
  };
}

interface PlanResponse {
  plan: "free" | "starter" | "pro" | "trial";
}

export function usePlan() {
  const teamInfo = useTeam();

  const { data: plan, error } = useSWR<PlanResponse>(
    teamInfo?.currentTeam?.id &&
      `/api/teams/${teamInfo?.currentTeam?.id}/billing/plan`,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  return {
    plan,
    loading: !plan && !error,
    error,
  };
}
