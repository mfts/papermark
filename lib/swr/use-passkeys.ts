import useSWR from "swr";

import { fetcher } from "@/lib/utils";

interface PasskeyCredential {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string;
  transports: string[];
  backup_eligible: boolean;
  backup_state: boolean;
  is_mfa: boolean;
}

export function usePasskeys() {
  const { data, error, mutate, isValidating } = useSWR<{
    passkeys: PasskeyCredential[];
  }>("/api/account/passkeys", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    passkeys: data?.passkeys || [],
    loading: !data && !error,
    error,
    mutate,
    isValidating,
  };
}
