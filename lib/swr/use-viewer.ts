import { useRouter } from "next/router";

import { useTeam } from "@/context/team-context";
import { View, Viewer } from "@prisma/client";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

type ViewerWithViews = Viewer & {
  views: {
    documentId: string;
    viewCount: number;
    viewIds: string[];
    lastViewed: Date;
  }[];
};

export default function useViewer() {
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { id } = router.query;

  const { data: viewer, error } = useSWR<ViewerWithViews>(
    teamId && id && `/api/teams/${teamId}/viewers/${id}`,
    fetcher,
  );

  return {
    viewer,
    loading: !viewer && !error,
    error,
  };
}
