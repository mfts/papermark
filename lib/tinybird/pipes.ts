import { Tinybird } from "@chronark/zod-bird";
import { z } from "zod";

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
