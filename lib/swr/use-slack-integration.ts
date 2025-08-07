import useSWR from "swr";

import { fetcher } from "@/lib/utils";
import { SlackIntegrationResponse } from "@/lib/types/slack";

interface UseSlackIntegrationProps {
    teamId?: string;
    enabled?: boolean;
}

export function useSlackIntegration({ teamId, enabled = true }: UseSlackIntegrationProps) {
    const { data, error, isLoading, mutate } = useSWR<SlackIntegrationResponse>(
        enabled && teamId ? `/api/teams/${teamId}/slack` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 30000,
            revalidateIfStale: false,
            errorRetryCount: 2,
            errorRetryInterval: 5000,
        }
    );

    return {
        integration: data || null,
        error,
        loading: isLoading && !data,
        mutate,
    };
} 