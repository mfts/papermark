-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "enableWatermark" BOOLEAN DEFAULT false,
ADD COLUMN     "watermarkConfig" JSONB;

