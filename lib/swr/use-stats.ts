import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { View } from "@prisma/client";

interface GroupedView {
  viewerEmail: string;
  _count: { id: number };
}

interface StatsData {
  views: View[];
  groupedViews: GroupedView[];
}

export function useStats() {
  const router = useRouter();

  const { id } = router.query as {
    id: string;
  };

  const { data: stats, error } = useSWR<StatsData>(
    id && `/api/documents/${encodeURIComponent(id)}/stats`,
    fetcher,
    {
      dedupingInterval: 10000,
    }
  );

  return {
    stats,
    loading: !error && !stats,
    error,
  };
}
