import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import {
  Link,
  Viewer,
  ViewerGroup,
  ViewerGroupAccessControls,
  ViewerGroupMembership,
} from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

import { LinkWithViews } from "../types";

export default function useDataroomGroups({ documentId }: { documentId?: string } = {}) {
  const teamInfo = useTeam();
  const router = useRouter();

  const isDataroom = router.pathname.includes("datarooms");
  const { id } = router.query as {
    id: string;
  };

  type ViewerGroupWithCount = ViewerGroup & {
    accessControls: ViewerGroupAccessControls[];
    _count: {
      members: number;
      views: number;
    };
  };

  const {
    data: viewerGroups,
    error,
    mutate,
  } = useSWR<ViewerGroupWithCount[]>(
    teamInfo?.currentTeam?.id &&
      id &&
      isDataroom &&
    `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${id}/groups${documentId ? `?documentId=${documentId}` : ""
    }`,
    fetcher,
    { dedupingInterval: 30000 },
  );

  return {
    viewerGroups,
    loading: !viewerGroups && !error,
    error,
    mutate,
  };
}

export function useDataroomGroupLinks() {
  const router = useRouter();

  const { id, groupId } = router.query as {
    id: string;
    groupId: string;
  };

  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: links, error } = useSWR<LinkWithViews[]>(
    teamId &&
      id &&
      `/api/teams/${teamId}/datarooms/${id}/groups/${groupId}/links`,
    fetcher,
    { dedupingInterval: 10000 },
  );

  return {
    links,
    loading: !error && !links,
    error,
  };
}

type ViewerGroupWithMembers = ViewerGroup & {
  members: (ViewerGroupMembership & { viewer: Viewer })[];
  accessControls: ViewerGroupAccessControls[];
};

export function useDataroomGroup() {
  const router = useRouter();
  const { id, groupId } = router.query as {
    id: string;
    groupId: string;
  };

  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: viewerGroup, error } = useSWR<ViewerGroupWithMembers>(
    teamId &&
      id &&
      groupId &&
      `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${id}/groups/${groupId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    viewerGroup,
    viewerGroupMembers: viewerGroup?.members ?? [],
    viewerGroupDomains: viewerGroup?.domains ?? [],
    viewerGroupAllowAll: viewerGroup?.allowAll ?? false,
    viewerGroupPermissions: viewerGroup?.accessControls ?? [],
    loading: !viewerGroup && !error,
    error,
  };
}

export function useDataroomGroupPermissions() {
  const router = useRouter();
  const { id, groupId } = router.query as {
    id: string;
    groupId: string;
  };

  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: viewerGroupPermissions, error } = useSWR<
    ViewerGroupAccessControls[]
  >(
    teamId &&
      id &&
      groupId &&
      `/api/teams/${teamId}/datarooms/${id}/groups/${groupId}/permissions`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    viewerGroupPermissions,
    loading: !viewerGroupPermissions && !error,
    error,
  };
}
