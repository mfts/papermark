/*
  Warnings:

  - You are about to drop the column `documentsIds` on the `Dataroom` table. All the data in the column will be lost.
  - You are about to drop the column `documentsLinks` on the `Dataroom` table. All the data in the column will be lost.
  - You are about to drop the column `documentsTitles` on the `Dataroom` table. All the data in the column will be lost.
  - You are about to drop the `HierarchicalDataroom` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HierarchicalDataroomView` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `Dataroom` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DataroomType" AS ENUM ('HIERARCHICAL', 'PAGED');

-- DropForeignKey
ALTER TABLE "DataroomFile" DROP CONSTRAINT "DataroomFile_dataroomId_fkey";

-- DropForeignKey
ALTER TABLE "DataroomFolder" DROP CONSTRAINT "DataroomFolder_dataroomId_fkey";

-- DropForeignKey
ALTER TABLE "HierarchicalDataroom" DROP CONSTRAINT "HierarchicalDataroom_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "HierarchicalDataroomView" DROP CONSTRAINT "HierarchicalDataroomView_dataroomId_fkey";

-- AlterTable
ALTER TABLE "Dataroom" DROP COLUMN "documentsIds",
DROP COLUMN "documentsLinks",
DROP COLUMN "documentsTitles",
ADD COLUMN     "type" "DataroomType" NOT NULL;

-- AlterTable
ALTER TABLE "DataroomFile" ALTER COLUMN "parentFolderId" DROP NOT NULL;

-- DropTable
DROP TABLE "HierarchicalDataroom";

-- DropTable
DROP TABLE "HierarchicalDataroomView";

-- AddForeignKey
ALTER TABLE "DataroomFolder" ADD CONSTRAINT "DataroomFolder_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFile" ADD CONSTRAINT "DataroomFile_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
