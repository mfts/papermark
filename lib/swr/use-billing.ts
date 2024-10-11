import { useRouter } from "next/router";

import { useMemo } from "react";

import { useTeam } from "@/context/team-context";
import { parse } from "path";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

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

export type BasePlan =
  | "free"
  | "starter"
  | "pro"
  | "trial"
  | "business"
  | "datarooms";
type PlanWithTrial = `${BasePlan}+drtrial`;
type PlanWithOld = `${BasePlan}+old` | `${BasePlan}+drtrial+old`;

type PlanResponse = {
  plan: BasePlan | PlanWithTrial | PlanWithOld;
  isCustomer: boolean;
};

interface PlanDetails {
  plan: BasePlan | null;
  trial: string | null;
  old: boolean;
}

function parsePlan(plan: BasePlan | PlanWithTrial | PlanWithOld): PlanDetails {
  if (!plan) return { plan: null, trial: null, old: false };

  // Split the plan on '+'
  const parts = plan.split("+");
  return {
    plan: parts[0] as BasePlan, // Always the base plan
    trial: parts.includes("drtrial") ? "drtrial" : null, // 'drtrial' if present, otherwise null
    old: parts.includes("old"), // true if 'old' is present, otherwise false
  };
}

export function usePlan() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: plan, error } = useSWR<PlanResponse>(
    teamId && `/api/teams/${teamId}/billing/plan`,
    fetcher,
  );

  // Parse the plan using the parsing function
  const parsedPlan = plan
    ? parsePlan(plan.plan)
    : { plan: null, trial: null, old: false };

  return {
    plan: parsedPlan.plan,
    trial: parsedPlan.trial,
    isOldAccount: parsedPlan.old,
    isCustomer: plan?.isCustomer,
    loading: !plan && !error,
    error,
  };
}
