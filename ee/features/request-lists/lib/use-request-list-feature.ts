"use client";

import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";

export function useRequestListFeatureEnabled(): boolean {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled("requestList");
}