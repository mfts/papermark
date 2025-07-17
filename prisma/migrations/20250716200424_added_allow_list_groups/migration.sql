-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "allowListGroupId" TEXT;

-- AlterTable
ALTER TABLE "LinkPreset" ADD COLUMN     "allowListGroupId" TEXT;

-- CreateTable
CREATE TABLE "AllowListGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowList" TEXT[],
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllowListGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AllowListGroup_teamId_idx" ON "AllowListGroup"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "AllowListGroup_teamId_name_key" ON "AllowListGroup"("teamId", "name");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_allowListGroupId_fkey" FOREIGN KEY ("allowListGroupId") REFERENCES "AllowListGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkPreset" ADD CONSTRAINT "LinkPreset_allowListGroupId_fkey" FOREIGN KEY ("allowListGroupId") REFERENCES "AllowListGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowListGroup" ADD CONSTRAINT "AllowListGroup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
