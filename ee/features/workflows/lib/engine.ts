import prisma from "@/lib/prisma";

import {
  type Action,
  ActionSchema,
  type Condition,
  ConditionsConfigSchema,
  type StepExecutionResult,
  type WorkflowExecutionContext,
  type WorkflowExecutionResult,
} from "./types";

export class WorkflowEngine {
  /**
   * Execute a workflow by entry link ID
   */
  async execute(
    entryLinkId: string,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowExecutionResult> {
    try {
      // 1. Find workflow by entry link
      const workflow = await prisma.workflow.findUnique({
        where: { entryLinkId },
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      });

      if (!workflow) {
        return {
          success: false,
          error: "Workflow not found",
        };
      }

      if (!workflow.isActive) {
        return {
          success: false,
          error: "Workflow is not active",
        };
      }

      if (workflow.steps.length === 0) {
        return {
          success: false,
          error: "Workflow has no routing steps configured",
        };
      }

      // 2. Create execution record
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          visitorEmail: context.visitorEmail,
          visitorIp: context.visitorIp,
          status: "IN_PROGRESS",
          metadata: context.metadata || {},
        },
      });

      try {
        // 3. Execute steps in order until a match is found
        let targetLinkId: string | undefined;
        let targetDocumentId: string | undefined;
        let targetDataroomId: string | undefined;

        for (const step of workflow.steps) {
          const startTime = Date.now();

          try {
            // Parse step data
            const conditions = ConditionsConfigSchema.parse(step.conditions);
            const actions = (step.actions as any[]).map((action) =>
              ActionSchema.parse(action),
            );

            // Evaluate conditions
            const conditionsMatched = await this.evaluateConditions(
              conditions,
              context,
            );

            let actionsResult: (Action & { routed: boolean }) | undefined;

            // If conditions matched, execute the route action
            if (conditionsMatched && actions.length > 0) {
              const routeAction = actions[0]; // Only support single route action for now
              if (routeAction.type === "route") {
                targetLinkId = routeAction.targetLinkId;
                targetDocumentId = routeAction.targetDocumentId;
                targetDataroomId = routeAction.targetDataroomId;
                actionsResult = { ...routeAction, routed: true };
              }
            }

            // Log step execution
            await prisma.workflowStepLog.create({
              data: {
                executionId: execution.id,
                workflowStepId: step.id,
                conditionsMatched,
                conditionResults: conditions,
                ...(actionsResult ? { actionsExecuted: [actionsResult] } : {}),
                duration: Date.now() - startTime,
              },
            });

            // If we found a match, stop processing further steps
            if (conditionsMatched && targetLinkId) {
              break;
            }
          } catch (stepError) {
            // Log step error
            await prisma.workflowStepLog.create({
              data: {
                executionId: execution.id,
                workflowStepId: step.id,
                conditionsMatched: false,
                error:
                  stepError instanceof Error
                    ? stepError.message
                    : "Unknown error",
                duration: Date.now() - startTime,
              },
            });
            console.error(`Error executing step ${step.id}:`, stepError);
          }
        }

        // 4. Check if we found a target link
        if (!targetLinkId) {
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              result: {
                success: false,
                error: "No matching routing rule found for this email",
              },
            },
          });

          return {
            success: false,
            error: "No matching routing rule found for this email",
            executionId: execution.id,
          };
        }

        // 5. Fetch target link details
        const targetLink = await prisma.link.findUnique({
          where: { id: targetLinkId },
          select: {
            id: true,
            linkType: true,
            documentId: true,
            dataroomId: true,
            domainSlug: true,
            slug: true,
          },
        });

        if (!targetLink) {
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: "FAILED",
              completedAt: new Date(),
              result: {
                success: false,
                error: "Target link not found",
              },
            },
          });

          return {
            success: false,
            error: "Target link not found",
            executionId: execution.id,
          };
        }

        // 6. Build target URL
        let targetUrl: string;
        if (targetLink.domainSlug && targetLink.slug) {
          targetUrl = `https://${targetLink.domainSlug}/${targetLink.slug}`;
        } else {
          targetUrl = `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${targetLink.id}`;
        }

        // 7. Mark execution as completed
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            result: {
              success: true,
              targetLinkId: targetLink.id,
              targetLinkType: targetLink.linkType,
              targetUrl,
            },
          },
        });

        return {
          success: true,
          targetLinkId: targetLink.id,
          targetLinkType: targetLink.linkType as
            | "DOCUMENT_LINK"
            | "DATAROOM_LINK",
          targetDocumentId: targetLink.documentId || undefined,
          targetDataroomId: targetLink.dataroomId || undefined,
          targetUrl,
          executionId: execution.id,
        };
      } catch (error) {
        // Mark execution as failed
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            result: {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          },
        });
        throw error;
      }
    } catch (error) {
      console.error("Workflow execution error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Workflow execution failed",
      };
    }
  }

  /**
   * Evaluate conditions for a workflow step
   */
  private async evaluateConditions(
    conditionsConfig: { logic: "AND" | "OR"; items: Condition[] },
    context: WorkflowExecutionContext,
  ): Promise<boolean> {
    if (!conditionsConfig || !conditionsConfig.items?.length) {
      return true; // No conditions = always pass
    }

    const results = await Promise.all(
      conditionsConfig.items.map((condition) =>
        this.evaluateCondition(condition, context),
      ),
    );

    return conditionsConfig.logic === "AND"
      ? results.every((r) => r)
      : results.some((r) => r);
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: Condition,
    context: WorkflowExecutionContext,
  ): Promise<boolean> {
    switch (condition.type) {
      case "email":
        return this.evaluateEmailCondition(condition, context.visitorEmail);

      case "domain":
        return this.evaluateDomainCondition(condition, context.visitorEmail);

      default:
        return false;
    }
  }

  /**
   * Evaluate email condition
   */
  private evaluateEmailCondition(
    condition: { operator: string; value: string | string[] },
    email: string,
  ): boolean {
    const normalizedEmail = email.toLowerCase();

    switch (condition.operator) {
      case "equals":
        return normalizedEmail === (condition.value as string).toLowerCase();

      case "contains":
        return normalizedEmail.includes(
          (condition.value as string).toLowerCase(),
        );

      case "matches":
        try {
          return new RegExp(condition.value as string).test(normalizedEmail);
        } catch {
          return false;
        }

      case "in_list":
        return (condition.value as string[]).some(
          (v) => normalizedEmail === v.toLowerCase(),
        );

      default:
        return false;
    }
  }

  /**
   * Evaluate domain condition
   */
  private evaluateDomainCondition(
    condition: { operator: string; value: string | string[] },
    email: string,
  ): boolean {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;

    switch (condition.operator) {
      case "equals":
        return domain === (condition.value as string).toLowerCase();

      case "contains":
        return domain.includes((condition.value as string).toLowerCase());

      case "in_list":
        return (condition.value as string[]).some(
          (v) => domain === v.toLowerCase(),
        );

      default:
        return false;
    }
  }
}
