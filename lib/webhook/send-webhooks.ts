import { Webhook } from "@prisma/client";

import { createWebhookSignature } from "./signature";
import { prepareWebhookPayload } from "./transform";
import { EventDataProps, WebhookPayload, WebhookTrigger } from "./types";

// Strip path, query, and credentials from a URL so logs never expose
// secrets embedded in webhook endpoints (tokens in path/query, basic auth, etc.).
const redactUrl = (url: string): string => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "[invalid-url]";
  }
};

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

  const deliverFn = process.env.QSTASH_TOKEN
    ? publishWebhookEventToQStash
    : publishWebhookEventDirect;

  // Use allSettled so a single failure does not prevent the remaining
  // webhooks in the batch from being delivered.
  const results = await Promise.allSettled(
    webhooks.map((webhook) => deliverFn({ webhook, payload })),
  );

  const fulfilled: Awaited<ReturnType<typeof deliverFn>>[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      fulfilled.push(result.value);
    } else {
      const webhook = webhooks[i];
      const reasonMessage =
        result.reason instanceof Error
          ? result.reason.message
          : typeof result.reason === "string"
            ? result.reason
            : "Unknown error";
      console.error(
        `Failed to deliver webhook ${webhook.pId} to ${redactUrl(webhook.url)}: ${reasonMessage}`,
      );
    }
  }

  return fulfilled;
};

// Deliver webhook event directly via fetch (used when QSTASH_TOKEN is not set,
// e.g. self-hosted deployments that don't use Upstash).
const publishWebhookEventDirect = async ({
  webhook,
  payload,
}: {
  webhook: Pick<Webhook, "pId" | "url" | "secret">;
  payload: WebhookPayload;
}) => {
  const signature = await createWebhookSignature(webhook.secret, payload);

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Papermark-Signature": signature,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `Webhook ${webhook.pId} (${redactUrl(webhook.url)}) responded ${response.status}: ${text}`,
      );
    }

    return { ok: response.ok, status: response.status };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Unknown error";
    console.error(
      `Failed to deliver webhook ${webhook.pId} to ${redactUrl(webhook.url)}: ${errorMessage}`,
    );
    throw error;
  }
};

// Publish webhook event to QStash (used when QSTASH_TOKEN is configured).
const publishWebhookEventToQStash = async ({
  webhook,
  payload,
}: {
  webhook: Pick<Webhook, "pId" | "url" | "secret">;
  payload: WebhookPayload;
}) => {
  // Dynamic import so self-hosted builds without QSTASH_TOKEN never initialise
  // the QStash client (which throws on missing token).
  const { qstash } = await import("@/lib/cron");

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
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Unknown error";
    console.error(
      `Failed to publish webhook event to QStash for webhook ${webhook.pId} (${redactUrl(webhook.url)}): ${errorMessage}`,
    );
    throw error;
  }
};
