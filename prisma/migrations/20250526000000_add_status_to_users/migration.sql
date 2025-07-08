-- AlterTable
ALTER TABLE "UserTeam" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

