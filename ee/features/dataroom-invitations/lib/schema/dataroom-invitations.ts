import { z } from "zod";

import { DEFAULT_INVITATION_LIMITS } from "@/ee/limits/constants";

const MAX_CUSTOM_MESSAGE_LENGTH = 500;
// Absolute maximum for schema validation (team-specific limits are enforced in the API)
const ABSOLUTE_MAX_EMAILS = 100;

export const invitationEmailSchema = z.string().email();

const trimmedCustomMessageSchema = z
  .string()
  .max(MAX_CUSTOM_MESSAGE_LENGTH)
  .transform((value) => value.trim());

export const optionalCustomMessageSchema = z
  .union([trimmedCustomMessageSchema, z.literal(""), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    return value.length > 0 ? value : undefined;
  });

// Note: The schema uses a higher absolute max for validation.
// Team-specific limits (default: 30) are enforced in the API handlers.
export const sendGroupInvitationSchema = z.object({
  linkId: z.string().min(1),
  customMessage: optionalCustomMessageSchema,
  emails: z
    .array(invitationEmailSchema)
    .max(ABSOLUTE_MAX_EMAILS, `Maximum ${ABSOLUTE_MAX_EMAILS} emails allowed`)
    .optional(),
});

export const sendLinkInvitationSchema = z.object({
  customMessage: optionalCustomMessageSchema,
  emails: z
    .array(invitationEmailSchema)
    .max(ABSOLUTE_MAX_EMAILS, `Maximum ${ABSOLUTE_MAX_EMAILS} emails allowed`)
    .optional(),
});

// Re-export default limits for UI components
export { DEFAULT_INVITATION_LIMITS };

export const SendGroupInvitationSchema = sendGroupInvitationSchema;
export const SendLinkInvitationSchema = sendLinkInvitationSchema;

export type SendGroupInvitationInput = z.infer<typeof sendGroupInvitationSchema>;
export type SendLinkInvitationInput = z.infer<typeof sendLinkInvitationSchema>;

