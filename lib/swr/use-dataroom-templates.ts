import { useTeam } from "@/context/team-context";
import { Dataroom, DataroomBrand } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export type DataroomTemplate = Dataroom & {
    brand: Partial<DataroomBrand> | null;
};

export default function useDataroomTemplates() {
    const teamInfo = useTeam();
    const teamId = teamInfo?.currentTeam?.id;

    const { data: templates, error, mutate } = useSWR<DataroomTemplate[]>(
        teamId ? `/api/teams/${teamId}/datarooms/templates` : null,
        fetcher,
        {
            dedupingInterval: 120000,
        },
    );

    return {
        templates: templates || [],
        loading: !error && !templates,
        error,
        mutate,
    };
} 