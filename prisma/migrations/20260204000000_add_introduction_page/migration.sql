-- AlterTable
ALTER TABLE "Dataroom" ADD COLUMN     "introductionContent" JSONB,
ADD COLUMN     "introductionEnabled" BOOLEAN NOT NULL DEFAULT false;

