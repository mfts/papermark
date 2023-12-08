import { z } from "zod";

import { Tinybird } from "@chronark/zod-bird";

const tb = new Tinybird({ token: process.env.TINYBIRD_TOKEN! });

export const getTotalAvgPageDuration = tb.buildPipe({
  pipe: "get_total_average_page_duration__v2",
  parameters: z.object({
    documentId: z.string(),
    since: z.number(),
  }),
  data: z.object({
    versionNumber: z.number().int(),
    pageNumber: z.string(),
    avg_duration: z.number(),
  }),
});

export const getViewPageDuration = tb.buildPipe({
  pipe: "get_page_duration_per_view__v3",
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
