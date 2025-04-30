import { z } from "zod";

export const customFieldDataSchema = z.object({
  type: z.enum(["SHORT_TEXT", "LONG_TEXT", "NUMBER", "URL"]),
  identifier: z.string(),
  label: z.string(),
  placeholder: z.string().nullable().optional(),
  required: z.boolean().default(false),
  disabled: z.boolean().default(false),
  orderIndex: z.number().default(0),
});

export const watermarkConfigSchema = z
  .object({
    text: z.string(),
    isTiled: z.boolean(),
    color: z.string(),
    fontSize: z.number(),
    opacity: z.number(),
    rotation: z.number(),
    position: z.string(),
  })
  .nullable();

export const presetDataSchema = z.object({
  // Social Media Card
  enableCustomMetaTag: z.boolean(),
  name: z.string(),
  metaFavicon: z.string().nullable(),
  metaImage: z.string().nullable(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),

  // // Custom Fields
  // enableCustomFields: z.boolean(),
  // customFields: z.array(customFieldDataSchema).nullable(),

  // Watermark
  enableWatermark: z.boolean(),
  watermarkConfig: watermarkConfigSchema,

  // Viewer Access Control
  enableAllowList: z.boolean(),
  allowList: z.array(z.string()),
  enableDenyList: z.boolean(),
  denyList: z.array(z.string()),

  // Email Protection
  emailProtected: z.boolean(),
  emailAuthenticated: z.boolean(),
  allowDownload: z.boolean().optional(),
  enablePassword: z.boolean(),
  password: z.string().nullable(),
  expiresAt: z.string().nullable(),
  expiresIn: z.object({
    value: z.number(),
    type: z.enum(["natural", "normal"]),
  })
    .nullable(),
});

export type PresetDataSchema = z.infer<typeof presetDataSchema>;
