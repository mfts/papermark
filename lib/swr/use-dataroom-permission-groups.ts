import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { PermissionGroup, PermissionGroupAccessControls } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

export default function useDataroomPermissionGroups() {
  const teamInfo = useTeam();
  const router = useRouter();

  const isDataroom = router.pathname.includes("datarooms");
  const { id } = router.query as {
    id: string;
  };

  type PermissionGroupWithCount = PermissionGroup & {
    accessControls: PermissionGroupAccessControls[];
    links: {
      id: string;
      name: string | null;
    }[];
    _count: {
      links: number;
      accessControls: number;
    };
  };

  const {
    data: permissionGroups,
    error,
    mutate,
  } = useSWR<PermissionGroupWithCount[]>(
    teamInfo?.currentTeam?.id &&
    id &&
    isDataroom &&
    `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${id}/permission-groups`,
    fetcher,
    { dedupingInterval: 30000 },
  );

  return {
    permissionGroups,
    loading: !permissionGroups && !error,
    error,
    mutate,
  };
} 