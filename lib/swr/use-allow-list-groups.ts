import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export type AllowListGroup = {
    id: string;
    name: string;
    allowList: string[];
    teamId: string;
    createdAt: string;
    updatedAt: string;
    _count: {
        links: number;
    };
};

export type AllowListGroupWithUsage = AllowListGroup & {
    links: Array<{
        id: string;
        name: string;
        linkType: string;
        document?: {
            id: string;
            name: string;
        };
        dataroom?: {
            id: string;
            name: string;
        };
        _count: {
            views: number;
        };
    }>;
};

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export default function useAllowListGroups(
    page: number = 1,
    limit: number = 10,
    search: string = "",
) {
    const teamInfo = useTeam();
    const teamId = teamInfo?.currentTeam?.id;

    const {
        data,
        error,
        mutate,
    } = useSWR<{ groups: AllowListGroup[]; pagination: Pagination }>(
        teamId
            ? `/api/teams/${teamId}/allow-list-groups?page=${page}&limit=${limit}&search=${search}`
            : null,
        fetcher,
        {
            dedupingInterval: 30000,
        },
    );

    return {
        allowListGroups: data?.groups,
        pagination: data?.pagination,
        loading: !data && !error,
        error,
        mutate,
    };
}

export function useAllowListGroupsAll() {
    const teamInfo = useTeam();
    const teamId = teamInfo?.currentTeam?.id;

    const { data: allowListGroups, error, mutate } = useSWR<AllowListGroup[]>(
        teamId ? `/api/teams/${teamId}/allow-list-groups?all=true` : null,
        fetcher,
        {
            dedupingInterval: 30000,
        }
    );

    return {
        allowListGroups,
        loading: !allowListGroups && !error,
        error,
        mutate,
    };
}

export function useAllowListGroup(groupId: string | null) {
    const teamInfo = useTeam();
    const teamId = teamInfo?.currentTeam?.id;

    const { data: allowListGroup, error, mutate } = useSWR<AllowListGroupWithUsage>(
        teamId && groupId ? `/api/teams/${teamId}/allow-list-groups/${groupId}` : null,
        fetcher,
        {
            dedupingInterval: 30000,
        }
    );

    return {
        allowListGroup,
        loading: !allowListGroup && !error,
        error,
        mutate,
    };
}

export async function createAllowListGroup(
    teamId: string,
    data: { name: string; allowList: string[] }
) {
    const response = await fetch(`/api/teams/${teamId}/allow-list-groups`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create allow list group");
    }

    return response.json();
}

export async function updateAllowListGroup(
    teamId: string,
    groupId: string,
    data: { name?: string; allowList?: string[] }
) {
    const response = await fetch(`/api/teams/${teamId}/allow-list-groups/${groupId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update allow list group");
    }

    return response.json();
}

export async function deleteAllowListGroup(teamId: string, groupId: string) {
    const response = await fetch(`/api/teams/${teamId}/allow-list-groups/${groupId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete allow list group");
    }

    return response.json();
} 