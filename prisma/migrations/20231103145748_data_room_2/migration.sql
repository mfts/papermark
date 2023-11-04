/*
  Warnings:

  - You are about to drop the `_DataroomToDocument` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DataroomToDocument" DROP CONSTRAINT "_DataroomToDocument_A_fkey";

-- DropForeignKey
ALTER TABLE "_DataroomToDocument" DROP CONSTRAINT "_DataroomToDocument_B_fkey";

-- AlterTable
ALTER TABLE "Dataroom" ADD COLUMN     "documentsIds" TEXT[],
ADD COLUMN     "documentsTitles" TEXT[];

-- DropTable
DROP TABLE "_DataroomToDocument";
