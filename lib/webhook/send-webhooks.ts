import { Webhook } from "@prisma/client";

import { qstash } from "@/lib/cron";

import { createWebhookSignature } from "./signature";
import { prepareWebhookPayload } from "./transform";
import { EventDataProps, WebhookPayload, WebhookTrigger } from "./types";

// Send webhooks to multiple webhooks
export const sendWebhooks = async ({
  webhooks,
  trigger,
  data,
}: {
  webhooks: Pick<Webhook, "pId" | "url" | "secret">[];
  trigger: WebhookTrigger;
  data: EventDataProps;
}) => {
  if (webhooks.length === 0) {
    return;
  }

  const payload = prepareWebhookPayload(trigger, data);

  const results = await Promise.allSettled(
    webhooks.map((webhook) =>
      publishWebhookEventToQStash({ webhook, payload }),
    ),
  );

  // Log any failed webhook deliveries without blocking the others
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      console.error(
        `Failed to publish webhook event to QStash for webhook ${webhooks[i].pId}:`,
        result.reason,
      );
    }
  }

  return results
    .filter(
      (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof publishWebhookEventToQStash>>> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);
};

// Publish webhook event to QStash
const publishWebhookEventToQStash = async ({
  webhook,
  payload,
}: {
  webhook: Pick<Webhook, "pId" | "url" | "secret">;
  payload: WebhookPayload;
}) => {
  const callbackUrl = new URL(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/callback`,
  );
  callbackUrl.searchParams.append("webhookId", webhook.pId);
  callbackUrl.searchParams.append("eventId", payload.id);
  callbackUrl.searchParams.append("event", payload.event);

  const signature = await createWebhookSignature(webhook.secret, payload);

  try {
    const response = await qstash.publishJSON({
      url: webhook.url,
      body: payload,
      headers: {
        "X-Papermark-Signature": signature,
        "Upstash-Hide-Headers": "true",
      },
      callback: callbackUrl.href,
      failureCallback: callbackUrl.href,
    });

    if (!response.messageId) {
      console.error("Failed to publish webhook event to QStash", response);
    }

    return response;
  } catch (error) {
    console.error(
      `QStash publish failed for webhook ${webhook.pId} (${webhook.url}):`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};
