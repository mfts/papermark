-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "pauseEndsAt" TIMESTAMP(3),
ADD COLUMN     "pauseStartsAt" TIMESTAMP(3),
ADD COLUMN     "pausedAt" TIMESTAMP(3);

