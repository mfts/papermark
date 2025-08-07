import useSWR from "swr";

import { fetcher } from "@/lib/utils";
import { SlackChannelsResponse } from "@/lib/types/slack";

interface UseSlackChannelsProps {
    teamId?: string;
    enabled?: boolean;
}

export function useSlackChannels({ teamId, enabled = true }: UseSlackChannelsProps) {
    const { data, error, isLoading, mutate } = useSWR<SlackChannelsResponse>(
        enabled && teamId ? `/api/teams/${teamId}/slack/channels` : null,
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
        channels: data?.channels || [],
        error,
        loading: isLoading && !data,
        mutate,
    };
} 