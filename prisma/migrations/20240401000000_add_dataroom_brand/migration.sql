-- CreateTable
CREATE TABLE "DataroomBrand" (
    "id" TEXT NOT NULL,
    "logo" TEXT,
    "banner" TEXT,
    "brandColor" TEXT,
    "accentColor" TEXT,
    "dataroomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataroomBrand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataroomBrand_dataroomId_key" ON "DataroomBrand"("dataroomId");

-- AddForeignKey
ALTER TABLE "DataroomBrand" ADD CONSTRAINT "DataroomBrand_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

