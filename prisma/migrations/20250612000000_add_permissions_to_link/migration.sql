-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "permissionGroupId" TEXT;

-- CreateTable
CREATE TABLE "PermissionGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataroomId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionGroupAccessControls" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canDownload" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadOriginal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionGroupAccessControls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PermissionGroup_dataroomId_idx" ON "PermissionGroup"("dataroomId" ASC);

-- CreateIndex
CREATE INDEX "PermissionGroup_teamId_idx" ON "PermissionGroup"("teamId" ASC);

-- CreateIndex
CREATE INDEX "PermissionGroupAccessControls_groupId_idx" ON "PermissionGroupAccessControls"("groupId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PermissionGroupAccessControls_groupId_itemId_key" ON "PermissionGroupAccessControls"("groupId" ASC, "itemId" ASC);

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_permissionGroupId_fkey" FOREIGN KEY ("permissionGroupId") REFERENCES "PermissionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionGroup" ADD CONSTRAINT "PermissionGroup_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionGroup" ADD CONSTRAINT "PermissionGroup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionGroupAccessControls" ADD CONSTRAINT "PermissionGroupAccessControls_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PermissionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

