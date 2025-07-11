import { useTeam } from "@/context/team-context";
import { AccessRequest } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

type AccessRequestWithDetails = AccessRequest & {
    link: {
    id: string;
        name: string;
        linkType: string;
        allowList: string[];
        denyList: string[];
        document?: { name: string };
        dataroom?: { name: string };
    };
    approver?: {
        id: string;
        name: string;
    email: string;
    };
};

interface AccessRequestResponse {
    accessRequests: AccessRequestWithDetails[];
    pagination?: {
        total: number;
        pages: number;
        currentPage: number;
        pageSize: number;
    };
}

export function useAccessRequests() {
    const { currentTeam } = useTeam();

    const { data: accessRequests, error, mutate, isValidating } = useSWR<AccessRequestResponse>(
        currentTeam?.id ? `/api/teams/${currentTeam.id}/access-requests` : null,
        fetcher,
        {
            dedupingInterval: 30000,
        },
    );

    return {
        accessRequests: accessRequests?.accessRequests,
        pagination: accessRequests?.pagination,
        isValidating,
        error,
        mutate,
    };
} 