import { z } from "zod";

// Base FAQ schema with core validation rules
const baseFAQSchema = z.object({
  editedQuestion: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(1000, "Question too long"),
  answer: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(1000, "Answer too long"),
  visibilityMode: z.enum(["PUBLIC_DATAROOM", "PUBLIC_LINK", "PUBLIC_DOCUMENT"]),
});

// Schema for publishing a new FAQ
export const publishFAQSchema = baseFAQSchema
  .extend({
    originalQuestion: z.string().optional(),
    linkId: z.string().cuid("Invalid link ID format").optional(),
    dataroomDocumentId: z.string().cuid("Invalid document ID format").nullish(),
    sourceConversationId: z
      .string()
      .cuid("Invalid conversation ID format")
      .optional(),
    questionMessageId: z
      .string()
      .cuid("Invalid question message ID format")
      .optional(),
    answerMessageId: z
      .string()
      .cuid("Invalid answer message ID format")
      .optional(),
    isAnonymized: z.boolean().default(true),
    documentPageNumber: z.number().int().min(1).optional(),
    documentVersionNumber: z.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.visibilityMode === "PUBLIC_LINK" && !data.linkId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Link ID is required for link visibility",
        path: ["linkId"],
      });
    }
    if (data.visibilityMode === "PUBLIC_DOCUMENT" && !data.dataroomDocumentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Document ID is required for document visibility",
        path: ["dataroomDocumentId"],
      });
    }
    if (
      (data.documentPageNumber != null || data.documentVersionNumber != null) &&
      !data.dataroomDocumentId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Document page/version requires a document",
        path: ["dataroomDocumentId"],
      });
    }
    if (
      (data.questionMessageId || data.answerMessageId) &&
      !data.sourceConversationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Message references require a source conversation",
        path: ["sourceConversationId"],
      });
    }
  });

// Schema for updating an existing FAQ (all fields optional except where business logic requires)
export const updateFAQSchema = z.object({
  editedQuestion: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(1000, "Question too long")
    .optional(),
  answer: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(1000, "Answer too long")
    .optional(),
  visibilityMode: z
    .enum(["PUBLIC_DATAROOM", "PUBLIC_LINK", "PUBLIC_DOCUMENT"])
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

// Frontend form validation schemas
export const publishFAQFormSchema = baseFAQSchema.extend({
  questionMessageId: z.string().cuid("Invalid question message ID"),
  answerMessageId: z.string().cuid("Invalid answer message ID"),
});

export const editFAQFormSchema = baseFAQSchema;

// Parameter validation schemas
export const faqParamSchema = z.object({
  teamId: z.string().cuid("Invalid team ID format"),
  id: z.string().cuid("Invalid dataroom ID format"),
  faqId: z.string().cuid("Invalid FAQ ID format").optional(),
});

// Type exports
export type PublishFAQInput = z.infer<typeof publishFAQSchema>;
export type UpdateFAQInput = z.infer<typeof updateFAQSchema>;
export type PublishFAQFormInput = z.infer<typeof publishFAQFormSchema>;
export type EditFAQFormInput = z.infer<typeof editFAQFormSchema>;
export type FAQParamInput = z.infer<typeof faqParamSchema>;
