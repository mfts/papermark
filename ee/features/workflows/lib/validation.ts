import { ZodError } from "zod";

import {
  type Action,
  ActionSchema,
  type ConditionsConfig,
  ConditionsConfigSchema,
  CreateWorkflowRequestSchema,
  CreateWorkflowStepRequestSchema,
  ReorderStepsRequestSchema,
  UpdateWorkflowRequestSchema,
  UpdateWorkflowStepRequestSchema,
  type WorkflowStepDefinition,
  WorkflowStepDefinitionSchema,
} from "./types";

export {
  CreateWorkflowRequestSchema,
  UpdateWorkflowRequestSchema,
  CreateWorkflowStepRequestSchema,
  UpdateWorkflowStepRequestSchema,
  ReorderStepsRequestSchema,
};

/**
 * Validates workflow step conditions JSON against the schema
 */
export function validateConditions(
  conditions: unknown,
): { valid: true; data: ConditionsConfig } | { valid: false; error: string } {
  try {
    const data = ConditionsConfigSchema.parse(conditions);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        valid: false,
        error: error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      };
    }
    return { valid: false, error: "Invalid conditions format" };
  }
}

/**
 * Validates workflow step actions JSON against the schema
 */
export function validateActions(
  actions: unknown,
): { valid: true; data: Action[] } | { valid: false; error: string } {
  try {
    if (!Array.isArray(actions)) {
      return { valid: false, error: "Actions must be an array" };
    }
    const data = actions.map((action) => ActionSchema.parse(action));
    return { valid: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        valid: false,
        error: error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      };
    }
    return { valid: false, error: "Invalid actions format" };
  }
}

/**
 * Validates complete workflow step definition
 */
export function validateWorkflowStep(
  step: unknown,
):
  | { valid: true; data: WorkflowStepDefinition }
  | { valid: false; error: string } {
  try {
    const data = WorkflowStepDefinitionSchema.parse(step);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        valid: false,
        error: error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      };
    }
    return { valid: false, error: "Invalid workflow step format" };
  }
}

/**
 * Helper to format Zod validation errors for API responses
 */
export function formatZodError(error: ZodError): string {
  return error.errors
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join(", ");
}
