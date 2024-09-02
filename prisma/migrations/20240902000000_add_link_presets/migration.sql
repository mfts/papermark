-- CreateTable
CREATE TABLE "LinkPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "enableCustomMetaTag" BOOLEAN DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkPreset_teamId_idx" ON "LinkPreset"("teamId");

-- AddForeignKey
ALTER TABLE "LinkPreset" ADD CONSTRAINT "LinkPreset_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

