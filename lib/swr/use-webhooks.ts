import { Webhook } from "@prisma/client";
import useSWR from "swr";
import { fetcher } from "../utils";

export default function useWebhooks() {
  const { data: webhooks, isValidating } = useSWR<
  Webhook[]
>(
  "/api/webhooks",
  fetcher,
  {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  }
);

  return {
    webhooks,
    loading: webhooks ? false : true,
    isValidating,
  }
}