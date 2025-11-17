import { z } from "zod";

// ============ CONDITIONS ============

export const EmailConditionSchema = z.object({
  type: z.literal("email"),
  operator: z.enum(["equals", "contains", "matches", "in_list"]),
  value: z.union([z.string(), z.array(z.string())]),
});

export const DomainConditionSchema = z.object({
  type: z.literal("domain"),
  operator: z.enum(["equals", "contains", "in_list"]),
  value: z.union([z.string(), z.array(z.string())]),
});

export const ConditionSchema = z.discriminatedUnion("type", [
  EmailConditionSchema,
  DomainConditionSchema,
]);

export type EmailCondition = z.infer<typeof EmailConditionSchema>;
export type DomainCondition = z.infer<typeof DomainConditionSchema>;
export type Condition = z.infer<typeof ConditionSchema>;

// ============ ACTIONS ============

export const RouteActionSchema = z.object({
  type: z.literal("route"),
  targetLinkId: z.string().cuid(),
  // These are populated from the target link for reference
  targetDocumentId: z.string().cuid().optional(),
  targetDataroomId: z.string().cuid().optional(),
});

export const ActionSchema = z.discriminatedUnion("type", [RouteActionSchema]);

export type RouteAction = z.infer<typeof RouteActionSchema>;
export type Action = z.infer<typeof ActionSchema>;

// ============ WORKFLOW STEP DEFINITION ============

export const ConditionsConfigSchema = z.object({
  logic: z.enum(["AND", "OR"]),
  items: z.array(ConditionSchema),
});

export const WorkflowStepDefinitionSchema = z.object({
  name: z.string().min(1, "Step name is required"),
  stepOrder: z.number().int().nonnegative(),
  stepType: z.literal("ROUTER"),
  conditions: ConditionsConfigSchema,
  actions: z.array(ActionSchema).min(1, "At least one action is required"),
});

export type ConditionsConfig = z.infer<typeof ConditionsConfigSchema>;
export type WorkflowStepDefinition = z.infer<
  typeof WorkflowStepDefinitionSchema
>;

// ============ WORKFLOW API SCHEMAS ============

export const CreateWorkflowRequestSchema = z.object({
  name: z.string().min(1, "Workflow name is required").max(100),
  description: z.string().max(500).optional(),
  // Entry link details
  domain: z.string().nullish(), // null or undefined means papermark.com
  slug: z
    .string()
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Slug must contain only letters, numbers, and hyphens",
    )
    .min(1)
    .max(100)
    .nullish(), // slug is only required for custom domains, not for papermark.com
});

export const UpdateWorkflowRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const CreateWorkflowStepRequestSchema = z.object({
  name: z.string().min(1, "Step name is required"),
  conditions: ConditionsConfigSchema,
  actions: z.array(ActionSchema).min(1, "At least one action is required"),
});

export const UpdateWorkflowStepRequestSchema = z.object({
  name: z.string().min(1).optional(),
  conditions: ConditionsConfigSchema.optional(),
  actions: z.array(ActionSchema).min(1).optional(),
});

export const ReorderStepsRequestSchema = z.object({
  steps: z.array(
    z.object({
      stepId: z.string().cuid(),
      stepOrder: z.number().int().nonnegative(),
    }),
  ),
});

export const VerifyEmailRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const AccessRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().regex(/^\d{6}$/, "Verification code must be 6 digits"),
});

export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>;
export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowRequestSchema>;
export type CreateWorkflowStepRequest = z.infer<
  typeof CreateWorkflowStepRequestSchema
>;
export type UpdateWorkflowStepRequest = z.infer<
  typeof UpdateWorkflowStepRequestSchema
>;
export type ReorderStepsRequest = z.infer<typeof ReorderStepsRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;
export type AccessRequest = z.infer<typeof AccessRequestSchema>;

// ============ WORKFLOW ENGINE TYPES ============

export interface WorkflowExecutionContext {
  visitorEmail: string;
  visitorIp?: string;
  userAgent?: string;
  referrer?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  success: boolean;
  targetLinkId?: string;
  targetLinkType?: "DOCUMENT_LINK" | "DATAROOM_LINK";
  targetDocumentId?: string;
  targetDataroomId?: string;
  targetUrl?: string;
  error?: string;
  executionId?: string;
}

export interface StepExecutionResult {
  success: boolean;
  conditionsMatched: boolean;
  actionsResult?: any;
  error?: string;
}
