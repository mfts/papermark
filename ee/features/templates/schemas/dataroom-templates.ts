import { z } from "zod";

import { DATAROOM_TEMPLATE_TYPES } from "../constants/dataroom-templates";

export const applyTemplateSchema = z.object({
  type: z
    .enum(DATAROOM_TEMPLATE_TYPES, {
      errorMap: () => ({
        message: `Invalid template type. Must be one of: ${DATAROOM_TEMPLATE_TYPES.join(", ")}`,
      }),
    })
    .refine(
      (type) => {
        // Additional validation: ensure no path traversal or special characters
        return (
          !type.includes("..") &&
          !type.includes("/") &&
          !type.includes("\\") &&
          !type.includes("\0")
        );
      },
      {
        message: "Template type contains invalid characters",
      },
    ),
});

/**
 * Schema for validating dataroom generation request
 * Includes both name validation and template type validation
 */
export const generateDataroomSchema = z.object({
  name: z
    .string()
    .min(1, "Dataroom name is required")
    .max(255, "Dataroom name is too long")
    .refine(
      (name) => {
        // Ensure no malicious characters in the name
        return (
          !name.includes("\0") &&
          !name.includes("..") &&
          !name.includes("<script>")
        );
      },
      {
        message: "Dataroom name contains invalid characters",
      },
    ),
  type: z
    .enum(DATAROOM_TEMPLATE_TYPES, {
      errorMap: () => ({
        message: `Invalid template type. Must be one of: ${DATAROOM_TEMPLATE_TYPES.join(", ")}`,
      }),
    })
    .refine(
      (type) => {
        // Additional validation: ensure no path traversal or special characters
        return (
          !type.includes("..") &&
          !type.includes("/") &&
          !type.includes("\\") &&
          !type.includes("\0")
        );
      },
      {
        message: "Template type contains invalid characters",
      },
    ),
});

/**
 * Type exports for TypeScript
 */
export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;
export type GenerateDataroomInput = z.infer<typeof generateDataroomSchema>;
export type DataroomTemplateType = (typeof DATAROOM_TEMPLATE_TYPES)[number];
