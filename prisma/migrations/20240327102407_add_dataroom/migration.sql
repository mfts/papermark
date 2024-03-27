-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('DOCUMENT_LINK', 'DATAROOM_LINK');

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "dataroomId" TEXT,
ADD COLUMN     "linkType" "LinkType" NOT NULL DEFAULT 'DOCUMENT_LINK',
ALTER COLUMN "documentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "View" ADD COLUMN     "dataroomId" TEXT,
ADD COLUMN     "dataroomViewId" TEXT,
ALTER COLUMN "documentId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Dataroom" (
    "id" TEXT NOT NULL,
    "pId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataroomDocument" (
    "id" TEXT NOT NULL,
    "dataroomId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataroomDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataroomFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "parentId" TEXT,
    "dataroomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataroomFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dataroom_pId_key" ON "Dataroom"("pId");

-- CreateIndex
CREATE INDEX "Dataroom_teamId_idx" ON "Dataroom"("teamId");

-- CreateIndex
CREATE INDEX "DataroomDocument_folderId_idx" ON "DataroomDocument"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "DataroomDocument_dataroomId_documentId_key" ON "DataroomDocument"("dataroomId", "documentId");

-- CreateIndex
CREATE INDEX "DataroomFolder_parentId_idx" ON "DataroomFolder"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "DataroomFolder_dataroomId_path_key" ON "DataroomFolder"("dataroomId", "path");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataroom" ADD CONSTRAINT "Dataroom_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomDocument" ADD CONSTRAINT "DataroomDocument_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomDocument" ADD CONSTRAINT "DataroomDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomDocument" ADD CONSTRAINT "DataroomDocument_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "DataroomFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFolder" ADD CONSTRAINT "DataroomFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DataroomFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFolder" ADD CONSTRAINT "DataroomFolder_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
