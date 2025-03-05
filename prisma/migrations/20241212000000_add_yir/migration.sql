-- AlterTable
ALTER TABLE "UserTeam" ADD COLUMN     "notificationPreferences" JSONB;

-- CreateTable
CREATE TABLE "YearInReview" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempted" TIMESTAMP(3),
    "error" TEXT,
    "stats" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YearInReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YearInReview_status_attempts_idx" ON "YearInReview"("status", "attempts");

-- CreateIndex
CREATE INDEX "YearInReview_teamId_idx" ON "YearInReview"("teamId");

