import { z } from "zod";

export const NotificationFrequency = z.enum(["instant", "daily", "weekly"]);
export type NotificationFrequency = z.infer<typeof NotificationFrequency>;

export const ZViewerNotificationPreferencesSchema = z
  .object({
    dataroom: z.record(
      z.object({
        enabled: z.boolean(),
        frequency: NotificationFrequency.optional().default("instant"),
      }),
    ),
  })
  .optional()
  .default({ dataroom: {} });

export const ZUserNotificationPreferencesSchema = z
  .object({
    yearInReview: z.object({
      enabled: z.boolean(),
    }),
  })
  .optional()
  .default({ yearInReview: { enabled: true } });
