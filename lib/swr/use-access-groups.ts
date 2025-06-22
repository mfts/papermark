import { useTeam } from "@/context/team-context";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export type AccessGroup = {
    id: string;
    name: string;
    type: "ALLOW" | "BLOCK";
    emailList: string[];
    teamId: string;
    _count?: {
        allowLinks: number;
        blockLinks: number;
    };
    createdAt: string;
    updatedAt: string;
};

export default function useAccessGroups(type?: "ALLOW" | "BLOCK") {
    const teamInfo = useTeam();

    const {
        data: accessGroups,
        error,
        mutate,
    } = useSWR<AccessGroup[]>(
        teamInfo?.currentTeam?.id
            ? `/api/teams/${teamInfo.currentTeam.id}/access-groups${type ? `?type=${type}` : ''}`
            : null,
        fetcher,
        { dedupingInterval: 30000 },
    );

    return {
        accessGroups,
        loading: !accessGroups && !error,
        error,
        mutate,
    };
}

export function useAccessGroup(groupId: string | undefined) {
    const teamInfo = useTeam();

    const {
        data: accessGroup,
        error,
        mutate,
    } = useSWR<AccessGroup>(
        teamInfo?.currentTeam?.id && groupId
            ? `/api/teams/${teamInfo.currentTeam.id}/access-groups/${groupId}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        },
    );

    return {
        accessGroup,
        loading: !accessGroup && !error,
        error,
        mutate,
    };
}


export const useAllowListGroups = () => useAccessGroups("ALLOW");
export const useAllowListGroup = useAccessGroup;
export type AllowListGroup = AccessGroup; 