-- CreateEnum
CREATE TYPE "AccessGroupType" AS ENUM ('ALLOW', 'BLOCK');

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "allowAccessGroupId" TEXT,
ADD COLUMN     "blockAccessGroupId" TEXT;

-- AlterTable
ALTER TABLE "LinkPreset" ADD COLUMN     "allowAccessGroupId" TEXT,
ADD COLUMN     "blockAccessGroupId" TEXT;

-- CreateTable
CREATE TABLE "AccessGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccessGroupType" NOT NULL,
    "teamId" TEXT NOT NULL,
    "emailList" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessGroup_teamId_idx" ON "AccessGroup"("teamId");

-- CreateIndex
CREATE INDEX "AccessGroup_type_idx" ON "AccessGroup"("type");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_allowAccessGroupId_fkey" FOREIGN KEY ("allowAccessGroupId") REFERENCES "AccessGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_blockAccessGroupId_fkey" FOREIGN KEY ("blockAccessGroupId") REFERENCES "AccessGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkPreset" ADD CONSTRAINT "LinkPreset_allowAccessGroupId_fkey" FOREIGN KEY ("allowAccessGroupId") REFERENCES "AccessGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkPreset" ADD CONSTRAINT "LinkPreset_blockAccessGroupId_fkey" FOREIGN KEY ("blockAccessGroupId") REFERENCES "AccessGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessGroup" ADD CONSTRAINT "AccessGroup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
