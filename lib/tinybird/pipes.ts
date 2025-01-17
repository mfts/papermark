import { Tinybird } from "@chronark/zod-bird";
import { z } from "zod";

import { VIDEO_EVENT_TYPES } from "../constants";
import { WEBHOOK_TRIGGERS } from "../webhook/constants";

const tb = new Tinybird({ token: process.env.TINYBIRD_TOKEN! });

export const getTotalAvgPageDuration = tb.buildPipe({
  pipe: "get_total_average_page_duration__v5",
  parameters: z.object({
    documentId: z.string(),
    excludedLinkIds: z.string().describe("Comma separated linkIds"),
    excludedViewIds: z.string().describe("Comma separated viewIds"),
    since: z.number(),
  }),
  data: z.object({
    versionNumber: z.number().int(),
    pageNumber: z.string(),
    avg_duration: z.number(),
  }),
});

export const getViewPageDuration = tb.buildPipe({
  pipe: "get_page_duration_per_view__v5",
  parameters: z.object({
    documentId: z.string(),
    viewId: z.string(),
    since: z.number(),
  }),
  data: z.object({
    pageNumber: z.string(),
    sum_duration: z.number(),
  }),
});

export const getTotalDocumentDuration = tb.buildPipe({
  pipe: "get_total_document_duration__v1",
  parameters: z.object({
    documentId: z.string(),
    excludedLinkIds: z.string().describe("Comma separated linkIds"),
    excludedViewIds: z.string().describe("Comma separated viewIds"),
    since: z.number(),
  }),
  data: z.object({
    sum_duration: z.number(),
  }),
});

export const getViewUserAgent = tb.buildPipe({
  pipe: "get_useragent_per_view__v2",
  parameters: z.object({
    documentId: z.string(),
    viewId: z.string(),
    since: z.number(),
  }),
  data: z.object({
    country: z.string(),
    city: z.string(),
    browser: z.string(),
    os: z.string(),
    device: z.string(),
  }),
});

export const getTotalDataroomDuration = tb.buildPipe({
  pipe: "get_total_dataroom_duration__v1",
  parameters: z.object({
    dataroomId: z.string(),
    excludedLinkIds: z.array(z.string()),
    excludedViewIds: z.array(z.string()),
    since: z.number(),
  }),
  data: z.object({
    viewId: z.string(),
    sum_duration: z.number(),
  }),
});

export const getDocumentDurationPerViewer = tb.buildPipe({
  pipe: "get_document_duration_per_viewer__v1",
  parameters: z.object({
    documentId: z.string(),
    viewIds: z.string().describe("Comma separated viewIds"),
  }),
  data: z.object({
    sum_duration: z.number(),
  }),
});

export const getWebhookEvents = tb.buildPipe({
  pipe: "get_webhook_events__v1",
  parameters: z.object({
    webhookId: z.string(),
  }),
  data: z.object({
    event_id: z.string(),
    webhook_id: z.string(),
    message_id: z.string(), // QStash message ID
    event: z.enum(WEBHOOK_TRIGGERS),
    url: z.string(),
    http_status: z.number(),
    request_body: z.string(),
    response_body: z.string(),
    timestamp: z.string(),
  }),
});

export const getVideoEventsByDocument = tb.buildPipe({
  pipe: "get_video_events_by_document__v1",
  parameters: z.object({
    document_id: z.string(),
  }),
  data: z.object({
    timestamp: z.string(),
    view_id: z.string(),
    event_type: z.enum(VIDEO_EVENT_TYPES),
    start_time: z.number(),
    end_time: z.number(),
    playback_rate: z.number(),
    volume: z.number(),
    is_muted: z.number(),
    is_focused: z.number(),
    is_fullscreen: z.number(),
  }),
});

export const getVideoEventsByView = tb.buildPipe({
  pipe: "get_video_events_by_view__v1",
  parameters: z.object({
    document_id: z.string(),
    view_id: z.string(),
  }),
  data: z.object({
    timestamp: z.string(),
    event_type: z.string(),
    start_time: z.number(),
    end_time: z.number(),
  }),
});

export const getClickEventsByView = tb.buildPipe({
  pipe: "get_click_events_by_view__v1",
  parameters: z.object({
    document_id: z.string(),
    view_id: z.string(),
  }),
  data: z.object({
    timestamp: z.string(),
    document_id: z.string(),
    dataroom_id: z.string().nullable(),
    view_id: z.string(),
    page_number: z.string(),
    version_number: z.number(),
    href: z.string(),
  }),
});
