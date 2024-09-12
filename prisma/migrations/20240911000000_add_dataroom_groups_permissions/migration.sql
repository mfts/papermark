-- CreateEnum
CREATE TYPE "LinkAudienceType" AS ENUM ('GENERAL', 'GROUP', 'TEAM');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('DATAROOM_DOCUMENT', 'DATAROOM_FOLDER');

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "audienceType" "LinkAudienceType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "View" ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "Viewer" ADD COLUMN     "teamId" TEXT;

-- CreateTable
CREATE TABLE "ViewerGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataroomId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViewerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewerGroupMembership" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViewerGroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewerGroupAccessControls" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canDownload" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViewerGroupAccessControls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ViewerGroup_dataroomId_idx" ON "ViewerGroup"("dataroomId");

-- CreateIndex
CREATE INDEX "ViewerGroup_teamId_idx" ON "ViewerGroup"("teamId");

-- CreateIndex
CREATE INDEX "ViewerGroupMembership_viewerId_idx" ON "ViewerGroupMembership"("viewerId");

-- CreateIndex
CREATE INDEX "ViewerGroupMembership_groupId_idx" ON "ViewerGroupMembership"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ViewerGroupMembership_viewerId_groupId_key" ON "ViewerGroupMembership"("viewerId", "groupId");

-- CreateIndex
CREATE INDEX "ViewerGroupAccessControls_groupId_idx" ON "ViewerGroupAccessControls"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ViewerGroupAccessControls_groupId_itemId_key" ON "ViewerGroupAccessControls"("groupId", "itemId");

-- CreateIndex
CREATE INDEX "Viewer_teamId_idx" ON "Viewer"("teamId");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ViewerGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ViewerGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viewer" ADD CONSTRAINT "Viewer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewerGroup" ADD CONSTRAINT "ViewerGroup_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewerGroup" ADD CONSTRAINT "ViewerGroup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewerGroupMembership" ADD CONSTRAINT "ViewerGroupMembership_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewerGroupMembership" ADD CONSTRAINT "ViewerGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ViewerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewerGroupAccessControls" ADD CONSTRAINT "ViewerGroupAccessControls_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ViewerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

