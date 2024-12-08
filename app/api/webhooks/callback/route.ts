import { receiver } from "@/lib/cron";
import { recordWebhookEvent } from "@/lib/tinybird/publish";
import {
  webhookCallbackSchema,
  webhookPayloadSchema,
} from "@/lib/zod/schemas/webhooks";

// POST /api/webhooks/callback – listen to webhooks status from QStash
export const POST = async (req: Request) => {
  const rawBody = await req.json();

  const isValid = await receiver.verify({
    signature: req.headers.get("Upstash-Signature") || "",
    body: JSON.stringify(rawBody),
  });
  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { url, status, body, sourceBody, sourceMessageId } =
    webhookCallbackSchema.parse(rawBody);

  const request = Buffer.from(sourceBody, "base64").toString("utf-8");
  const response = Buffer.from(body, "base64").toString("utf-8");

  const { id: eventId, event } = webhookPayloadSchema.parse(
    JSON.parse(request),
  );

  const webhookId = new URL(req.url).searchParams.get("webhookId");

  await recordWebhookEvent({
    url,
    event,
    event_id: eventId,
    http_status: status,
    webhook_id: webhookId || "",
    request_body: request,
    response_body: response,
    message_id: sourceMessageId,
  });

  return new Response("OK");
};
