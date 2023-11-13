import { z } from "zod";

import { Tinybird } from "@chronark/zod-bird";

const tb = new Tinybird({ token: process.env.TINYBIRD_TOKEN! });

export const publishPageView = tb.buildIngestEndpoint({
  datasource: "page_views__v2",
  event: z.object({
    id: z.string(),
    linkId: z.string(),
    documentId: z.string(),
    viewId: z.string(),
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
