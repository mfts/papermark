/*
  Warnings:

  - You are about to drop the column `documentLinks` on the `Dataroom` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dataroom" DROP COLUMN "documentLinks",
ADD COLUMN     "documentsLinks" TEXT[];
