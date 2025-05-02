-- AlterTable
ALTER TABLE "LinkPreset" ADD COLUMN     "agreementId" TEXT,
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "enableAgreement" BOOLEAN DEFAULT false,
ADD COLUMN     "enableCustomFields" BOOLEAN DEFAULT false,
ADD COLUMN     "enableScreenshotProtection" BOOLEAN DEFAULT false;

