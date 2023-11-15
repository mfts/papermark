-- CreateTable
CREATE TABLE "DataroomView" (
    "id" TEXT NOT NULL,
    "dataroomId" TEXT NOT NULL,
    "viewerEmail" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataroomView_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DataroomView" ADD CONSTRAINT "DataroomView_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
