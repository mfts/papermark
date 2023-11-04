-- AlterTable
ALTER TABLE "User" ALTER COLUMN "plan" SET DEFAULT 'trial';

-- CreateTable
CREATE TABLE "Dataroom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DataroomToDocument" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DataroomToDocument_AB_unique" ON "_DataroomToDocument"("A", "B");

-- CreateIndex
CREATE INDEX "_DataroomToDocument_B_index" ON "_DataroomToDocument"("B");

-- AddForeignKey
ALTER TABLE "Dataroom" ADD CONSTRAINT "Dataroom_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DataroomToDocument" ADD CONSTRAINT "_DataroomToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DataroomToDocument" ADD CONSTRAINT "_DataroomToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
