import { z } from "zod";

import { WEBHOOK_TRIGGERS } from "@/lib/webhook/constants";

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(40),
  url: z.string().url().max(190),
  secret: z.string().startsWith("whsec_"),
  triggers: z.array(z.enum(WEBHOOK_TRIGGERS)),
});

export const updateWebhookSchema = createWebhookSchema.partial();

// Base event schema
const baseEventSchema = z.object({
  id: z.string().startsWith("evt_"),
  event: z.enum(WEBHOOK_TRIGGERS),
  createdAt: z.string().datetime(),
});

// View Event schema
const viewEventSchema = z.object({
  viewedAt: z.string().datetime(),
  viewId: z.string(),
  email: z.string().email().nullable(),
  emailVerified: z.boolean().default(false),
  country: z.string().nullable(),
  city: z.string().nullable(),
  device: z.string().nullable(),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  ua: z.string().nullable(),
  referer: z.string().nullable(),
});

// Link Event schema
const linkEventSchema = z.object({
  id: z.string(),
  url: z
    .string()
    .describe(
      "This is the full URL of the link e.g. https://www.agrowy.com/view/1234566",
    ),
  name: z.string().nullable(),
  domain: z.string(),
  key: z.string(),
  expiresAt: z.string().datetime().nullable(),
  hasPassword: z.boolean().default(false),
  allowList: z.array(z.string()),
  denyList: z.array(z.string()),
  enabledEmailProtection: z.boolean().default(false),
  enabledEmailVerification: z.boolean().default(false),
  allowDownload: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  enabledNotification: z.boolean().default(true),
  enabledFeedback: z.boolean().default(false),
  enabledQuestion: z.boolean().default(false),
  enabledScreenshotProtection: z.boolean().default(false),
  enabledAgreement: z.boolean().default(false),
  enabledWatermark: z.boolean().default(false),

  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  metaImage: z.string().nullable(),
  metaFavicon: z.string().nullable(),

  documentId: z.string().nullable(),
  dataroomId: z.string().nullable(),
  groupId: z.string().nullable(),

  linkType: z.enum(["DOCUMENT_LINK", "DATAROOM_LINK"]),
  teamId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Complete webhook payload schema
export const webhookPayloadSchema = baseEventSchema.extend({
  data: z.object({
    view: viewEventSchema,
    link: linkEventSchema,
    document: z
      .object({
        id: z.string(),
        name: z.string(),
        contentType: z.string().nullable(),
        teamId: z.string(),
      })
      .optional(),
    dataroom: z
      .object({
        id: z.string(),
        name: z.string(),
        teamId: z.string(),
      })
      .optional(),
  }),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

// Schema of response sent to the webhook callback URL by QStash
export const webhookCallbackSchema = z.object({
  status: z.number(),
  url: z.string(),
  createdAt: z.number(),
  sourceMessageId: z.string(),
  body: z.string().optional().default(""), // Response from the original webhook URL
  sourceBody: z.string(), // Original request payload from Papermark
});
