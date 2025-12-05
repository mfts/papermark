import { z } from "zod";

import { INVITATION_LIMITS } from "@/ee/features/security";

const MAX_CUSTOM_MESSAGE_LENGTH = 500;

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

export const sendGroupInvitationSchema = z.object({
  linkId: z.string().min(1),
  customMessage: optionalCustomMessageSchema,
  emails: z
    .array(invitationEmailSchema)
    .max(
      INVITATION_LIMITS.MAX_EMAILS_PER_REQUEST,
      `You can send a maximum of ${INVITATION_LIMITS.MAX_EMAILS_PER_REQUEST} invitations at a time`,
    )
    .optional(),
});

export const sendLinkInvitationSchema = z.object({
  customMessage: optionalCustomMessageSchema,
  emails: z
    .array(invitationEmailSchema)
    .max(
      INVITATION_LIMITS.MAX_EMAILS_PER_REQUEST,
      `You can send a maximum of ${INVITATION_LIMITS.MAX_EMAILS_PER_REQUEST} invitations at a time`,
    )
    .optional(),
});

export const SendGroupInvitationSchema = sendGroupInvitationSchema;
export const SendLinkInvitationSchema = sendLinkInvitationSchema;

export type SendGroupInvitationInput = z.infer<typeof sendGroupInvitationSchema>;
export type SendLinkInvitationInput = z.infer<typeof sendLinkInvitationSchema>;

