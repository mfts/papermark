import { newId } from "@/lib/id-helper";
import { webhookPayloadSchema } from "@/lib/zod/schemas/webhooks";

import { WebhookTrigger } from "./types";

export const prepareWebhookPayload = (trigger: WebhookTrigger, data: any) => {
  const payload = webhookPayloadSchema.parse({
    id: newId("webhookEvent"),
    event: trigger,
    data: data,
    createdAt: new Date().toISOString(),
  });

  return payload;
};
