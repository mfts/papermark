import { useRouter } from "next/router";
import useSWR from "swr";

import { useTeam } from "@/context/team-context";
import { fetcher } from "@/lib/utils";

export type DocumentAnalyticsFilterData = {
    availableLinks: Array<{ id: string; name: string }>;
    availableViewers: Array<{ email: string; viewerId?: string }>;
};

export function useDocumentAnalyticsFilters(includeLinks?: string) {
    const router = useRouter();
    const teamInfo = useTeam();
    const teamId = teamInfo?.currentTeam?.id;

    const { id: documentId } = router.query as {
        id: string;
    };

    const queryParams = new URLSearchParams();
    if (includeLinks) {
        queryParams.append("linkIds", includeLinks);
    }
    const queryString = queryParams.toString();
    const urlSuffix = queryString ? `?${queryString}` : "";

    const { data, error, mutate } = useSWR<DocumentAnalyticsFilterData>(
        documentId && teamId
            ? `/api/teams/${teamId}/documents/${encodeURIComponent(documentId)}/analytics-filters${urlSuffix}`
            : null,
        fetcher,
        {
            dedupingInterval: 30000,
            keepPreviousData: true,
        },
    );

    return {
        data,
        loading: !error && !data,
        error,
        mutate,
    };
} 