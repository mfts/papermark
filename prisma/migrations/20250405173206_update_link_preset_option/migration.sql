-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "LinkPreset" ADD COLUMN     "allowList" TEXT[],
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "denyList" TEXT[],
ADD COLUMN     "enableAllowList" BOOLEAN DEFAULT false,
ADD COLUMN     "enableCustomFields" BOOLEAN DEFAULT false,
ADD COLUMN     "enableDenyList" BOOLEAN DEFAULT false,
ADD COLUMN     "enableWatermark" BOOLEAN DEFAULT false,
ADD COLUMN     "watermarkConfig" JSONB;
