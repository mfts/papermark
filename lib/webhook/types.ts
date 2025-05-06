import { z } from "zod";

import {
  dataroomCreatedWebhookSchema,
  documentCreatedWebhookSchema,
  linkCreatedWebhookSchema,
  webhookPayloadSchema,
} from "../zod/schemas/webhooks";
import { WEBHOOK_TRIGGER_DESCRIPTIONS } from "./constants";

export type WebhookTrigger = keyof typeof WEBHOOK_TRIGGER_DESCRIPTIONS;

export type WebhookPayload =
  | z.infer<typeof webhookPayloadSchema>
  | z.infer<typeof linkCreatedWebhookSchema>
  | z.infer<typeof documentCreatedWebhookSchema>
  | z.infer<typeof dataroomCreatedWebhookSchema>;

// TODO: only show the link.viewed, link.created, document.created data props for now
export type EventDataProps = WebhookPayload["data"];
