import { Tinybird } from "@chronark/zod-bird";
import { z } from "zod";

import { WEBHOOK_TRIGGERS } from "../webhook/constants";

const tb = new Tinybird({ token: process.env.TINYBIRD_TOKEN! });

export const publishPageView = tb.buildIngestEndpoint({
  datasource: "page_views__v3",
  event: z.object({
    id: z.string(),
    linkId: z.string(),
    documentId: z.string(),
    viewId: z.string(),
    dataroomId: z.string().nullable().optional(),
    versionNumber: z.number().int().min(1).max(65535).optional().default(1),
    time: z.number().int(),
    duration: z.number().int(),
    pageNumber: z.string(),
    country: z.string().optional().default("Unknown"),
    city: z.string().optional().default("Unknown"),
    region: z.string().optional().default("Unknown"),
    latitude: z.string().optional().default("Unknown"),
    longitude: z.string().optional().default("Unknown"),
    ua: z.string().optional().default("Unknown"),
    browser: z.string().optional().default("Unknown"),
    browser_version: z.string().optional().default("Unknown"),
    engine: z.string().optional().default("Unknown"),
    engine_version: z.string().optional().default("Unknown"),
    os: z.string().optional().default("Unknown"),
    os_version: z.string().optional().default("Unknown"),
    device: z.string().optional().default("Desktop"),
    device_vendor: z.string().optional().default("Unknown"),
    device_model: z.string().optional().default("Unknown"),
    cpu_architecture: z.string().optional().default("Unknown"),
    bot: z.boolean().optional(),
    referer: z.string().optional().default("(direct)"),
    referer_url: z.string().optional().default("(direct)"),
  }),
});

export const recordWebhookEvent = tb.buildIngestEndpoint({
  datasource: "webhook_events__v1",
  event: z.object({
    event_id: z.string(),
    webhook_id: z.string(),
    message_id: z.string(), // QStash message ID
    event: z.enum(WEBHOOK_TRIGGERS),
    url: z.string(),
    http_status: z.number(),
    request_body: z.string(),
    response_body: z.string(),
  }),
});
