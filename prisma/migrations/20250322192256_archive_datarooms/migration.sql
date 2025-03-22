-- AlterTable
ALTER TABLE "Dataroom" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedBy" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
