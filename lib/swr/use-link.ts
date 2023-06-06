import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { LinkWithDocument } from "../types";

export function useLink() {
  const router = useRouter();

  const { linkId } = router.query as {
    linkId: string;
  };

  const { data: link, error } = useSWR<LinkWithDocument>(
    linkId && `/api/links/${encodeURIComponent(linkId)}`,
    fetcher,
    {
      dedupingInterval: 10000,
    }
  );

  return {
    link,
    loading: !error && !link,
    error,
  };
}
