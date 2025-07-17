-- CreateEnum
CREATE TYPE "DefaultPermissionStrategy" AS ENUM ('INHERIT_FROM_PARENT', 'ASK_EVERY_TIME', 'HIDDEN_BY_DEFAULT');

-- AlterTable
ALTER TABLE "Dataroom" ADD COLUMN     "defaultPermissionStrategy" "DefaultPermissionStrategy" NOT NULL DEFAULT 'INHERIT_FROM_PARENT';

