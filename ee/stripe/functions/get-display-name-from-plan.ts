import { PLANS } from "../utils";

export function getDisplayNameFromPlan(planSlug: string) {
  const cleanPlanName = planSlug.split("+")[0];
  const plan = PLANS.find((p) => p.slug === cleanPlanName);
  return plan?.name ?? "paid";
}
