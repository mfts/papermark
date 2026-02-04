import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export interface UserSessionData {
  id: string;
  browser: string | null;
  os: string | null;
  device: string | null;
  ipAddress: string | null;
  country: string | null;
  city: string | null;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export function useSessions() {
  const { data, error, isLoading, mutate } = useSWR<UserSessionData[]>(
    "/api/account/sessions",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    },
  );

  return {
    sessions: data ?? [],
    loading: isLoading,
    error,
    mutate,
  };
}
