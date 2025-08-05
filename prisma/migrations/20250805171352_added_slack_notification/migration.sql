-- CreateTable
CREATE TABLE "SlackIntegration" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "workspaceName" TEXT NOT NULL,
    "workspaceUrl" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "botUserId" TEXT NOT NULL,
    "botUsername" TEXT NOT NULL,
    "defaultChannel" TEXT,
    "enabledChannels" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationTypes" JSONB NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'instant',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "dailyTime" TEXT DEFAULT '10:00',
    "weeklyDay" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlackNotification" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "slackIntegrationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SlackIntegration_teamId_idx" ON "SlackIntegration"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "SlackIntegration_teamId_key" ON "SlackIntegration"("teamId");

-- CreateIndex
CREATE INDEX "SlackNotification_teamId_idx" ON "SlackNotification"("teamId");

-- CreateIndex
CREATE INDEX "SlackNotification_slackIntegrationId_idx" ON "SlackNotification"("slackIntegrationId");

-- CreateIndex
CREATE INDEX "SlackNotification_status_scheduledFor_idx" ON "SlackNotification"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "SlackNotification_createdAt_idx" ON "SlackNotification"("createdAt");

-- AddForeignKey
ALTER TABLE "SlackIntegration" ADD CONSTRAINT "SlackIntegration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlackNotification" ADD CONSTRAINT "SlackNotification_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlackNotification" ADD CONSTRAINT "SlackNotification_slackIntegrationId_fkey" FOREIGN KEY ("slackIntegrationId") REFERENCES "SlackIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
