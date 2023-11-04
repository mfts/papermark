import { useRouter } from "next/router";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { WebhookWithDocument } from "@/lib/types";

export default function useWebhooks() {
  const router = useRouter();

  const { data: webhooks, isValidating } = useSWR<WebhookWithDocument[]>(
    router.isReady && `/api/webhooks`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    webhooks,
    loading: webhooks ? false : true,
    isValidating,
  };
}
