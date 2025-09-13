-- CreateTable
CREATE TABLE "InstalledIntegration" (
    "id" TEXT NOT NULL,
    "credentials" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "integrationId" TEXT NOT NULL,
    "userId" TEXT,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "configuration" JSONB,

    CONSTRAINT "InstalledIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "readme" TEXT,
    "developer" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "logo" TEXT,
    "screenshots" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "installUrl" TEXT,
    "category" TEXT,
    "comingSoon" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstalledIntegration_integrationId_idx" ON "InstalledIntegration"("integrationId" ASC);

-- CreateIndex
CREATE INDEX "InstalledIntegration_teamId_idx" ON "InstalledIntegration"("teamId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "InstalledIntegration_teamId_integrationId_key" ON "InstalledIntegration"("teamId" ASC, "integrationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Integration_slug_key" ON "Integration"("slug" ASC);

-- AddForeignKey
ALTER TABLE "InstalledIntegration" ADD CONSTRAINT "InstalledIntegration_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstalledIntegration" ADD CONSTRAINT "InstalledIntegration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstalledIntegration" ADD CONSTRAINT "InstalledIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

