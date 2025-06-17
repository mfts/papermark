-- CreateEnum
CREATE TYPE "DefaultGroupPermissionStrategy" AS ENUM ('ask_every_time', 'inherit_from_parent', 'use_default_permissions', 'no_permissions');

-- AlterTable
ALTER TABLE "Dataroom" ADD COLUMN     "defaultGroupPermission" "DefaultGroupPermissionStrategy" NOT NULL DEFAULT 'ask_every_time';

-- AlterTable
ALTER TABLE "ViewerGroup" ADD COLUMN     "defaultCanDownload" BOOLEAN DEFAULT false,
ADD COLUMN     "defaultCanView" BOOLEAN DEFAULT false;
