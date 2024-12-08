import { z } from "zod";

import { webhookPayloadSchema } from "../zod/schemas/webhooks";
import { WEBHOOK_TRIGGER_DESCRIPTIONS } from "./constants";

export type WebhookTrigger = keyof typeof WEBHOOK_TRIGGER_DESCRIPTIONS;

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

// TODO: only show the link.viewed data props for now
export type EventDataProps = WebhookPayload["data"];
