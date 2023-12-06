/*
  Warnings:

  - You are about to drop the column `expires` on the `VerificationToken` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DataroomType" AS ENUM ('HIERARCHICAL', 'PAGED');

-- AlterTable
ALTER TABLE "VerificationToken" DROP COLUMN "expires",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT '2100-01-01 00:00:00 +00:00';

-- CreateTable
CREATE TABLE "Dataroom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DataroomType" NOT NULL,
    "description" TEXT,
    "emailProtected" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "Dataroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataroomView" (
    "id" TEXT NOT NULL,
    "dataroomId" TEXT NOT NULL,
    "viewerEmail" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataroomView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataroomFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentFolderId" TEXT,
    "dataroomId" TEXT NOT NULL,

    CONSTRAINT "DataroomFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataroomFile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "parentFolderId" TEXT,
    "dataroomId" TEXT NOT NULL,

    CONSTRAINT "DataroomFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dataroom" ADD CONSTRAINT "Dataroom_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataroom" ADD CONSTRAINT "Dataroom_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomView" ADD CONSTRAINT "DataroomView_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFolder" ADD CONSTRAINT "DataroomFolder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "DataroomFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFolder" ADD CONSTRAINT "DataroomFolder_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFile" ADD CONSTRAINT "DataroomFile_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "DataroomFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFile" ADD CONSTRAINT "DataroomFile_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
