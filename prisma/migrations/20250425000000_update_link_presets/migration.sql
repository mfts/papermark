-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "LinkPreset" ADD COLUMN     "allowDownload" BOOLEAN DEFAULT false,
ADD COLUMN     "allowList" TEXT[],
ADD COLUMN     "denyList" TEXT[],
ADD COLUMN     "emailAuthenticated" BOOLEAN DEFAULT false,
ADD COLUMN     "emailProtected" BOOLEAN DEFAULT true,
ADD COLUMN     "enableAllowList" BOOLEAN DEFAULT false,
ADD COLUMN     "enableDenyList" BOOLEAN DEFAULT false,
ADD COLUMN     "enablePassword" BOOLEAN DEFAULT false,
ADD COLUMN     "enableWatermark" BOOLEAN DEFAULT false,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "expiresIn" INTEGER,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pId" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "watermarkConfig" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "LinkPreset_pId_key" ON "LinkPreset"("pId" ASC);

