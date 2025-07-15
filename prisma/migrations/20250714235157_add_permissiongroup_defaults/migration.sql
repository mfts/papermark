-- CreateEnum
CREATE TYPE "DefaultLinkPermissionStrategy" AS ENUM ('inherit_from_parent', 'use_default_permissions', 'use_simple_permissions');

-- AlterTable
ALTER TABLE "Dataroom" ADD COLUMN     "defaultLinkCanDownload" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultLinkCanView" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultLinkPermission" "DefaultLinkPermissionStrategy" NOT NULL DEFAULT 'inherit_from_parent',
ALTER COLUMN "defaultGroupPermission" SET DEFAULT 'inherit_from_parent';

-- AlterTable
ALTER TABLE "PermissionGroup" ADD COLUMN     "defaultCanDownload" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultCanView" BOOLEAN NOT NULL DEFAULT false;
