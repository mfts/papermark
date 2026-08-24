-- CreateTable
CREATE TABLE "WatermarkPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatermarkPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatermarkPreset_teamId_idx" ON "WatermarkPreset"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "WatermarkPreset_teamId_name_key" ON "WatermarkPreset"("teamId", "name");

-- AddForeignKey
ALTER TABLE "WatermarkPreset" ADD CONSTRAINT "WatermarkPreset_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
