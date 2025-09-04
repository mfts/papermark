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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SlackIntegration_teamId_idx" ON "SlackIntegration"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "SlackIntegration_teamId_key" ON "SlackIntegration"("teamId");

-- AddForeignKey
ALTER TABLE "SlackIntegration" ADD CONSTRAINT "SlackIntegration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
