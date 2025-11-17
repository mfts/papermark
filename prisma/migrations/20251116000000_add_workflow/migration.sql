-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "WorkflowStepType" AS ENUM ('ROUTER');

-- AlterEnum
ALTER TYPE "LinkType" ADD VALUE 'WORKFLOW_LINK';

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entryLinkId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "visitorEmail" TEXT,
    "visitorIp" TEXT,
    "status" "ExecutionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "result" JSONB,
    "metadata" JSONB,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepType" "WorkflowStepType" NOT NULL DEFAULT 'ROUTER',
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStepLog" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "workflowStepId" TEXT NOT NULL,
    "conditionsMatched" BOOLEAN NOT NULL,
    "conditionResults" JSONB,
    "actionsExecuted" JSONB,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "error" TEXT,

    CONSTRAINT "WorkflowStepLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workflow_entryLinkId_idx" ON "Workflow"("entryLinkId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_entryLinkId_key" ON "Workflow"("entryLinkId" ASC);

-- CreateIndex
CREATE INDEX "Workflow_isActive_idx" ON "Workflow"("isActive" ASC);

-- CreateIndex
CREATE INDEX "Workflow_teamId_idx" ON "Workflow"("teamId" ASC);

-- CreateIndex
CREATE INDEX "WorkflowExecution_status_idx" ON "WorkflowExecution"("status" ASC);

-- CreateIndex
CREATE INDEX "WorkflowExecution_visitorEmail_idx" ON "WorkflowExecution"("visitorEmail" ASC);

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_startedAt_idx" ON "WorkflowExecution"("workflowId" ASC, "startedAt" ASC);

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowId_idx" ON "WorkflowStep"("workflowId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_workflowId_stepOrder_key" ON "WorkflowStep"("workflowId" ASC, "stepOrder" ASC);

-- CreateIndex
CREATE INDEX "WorkflowStepLog_executionId_idx" ON "WorkflowStepLog"("executionId" ASC);

-- CreateIndex
CREATE INDEX "WorkflowStepLog_workflowStepId_idx" ON "WorkflowStepLog"("workflowStepId" ASC);

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_entryLinkId_fkey" FOREIGN KEY ("entryLinkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStepLog" ADD CONSTRAINT "WorkflowStepLog_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStepLog" ADD CONSTRAINT "WorkflowStepLog_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "WorkflowStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

