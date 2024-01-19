-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "enableCustomMetatag" BOOLEAN DEFAULT false,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaImage" TEXT,
ADD COLUMN     "metaTitle" TEXT;

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "logo" TEXT,
    "brandColor" TEXT,
    "accentColor" TEXT,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_teamId_key" ON "Brand"("teamId");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
