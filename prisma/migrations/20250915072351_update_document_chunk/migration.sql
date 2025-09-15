/*
  Warnings:

  - You are about to drop the column `level` on the `DocumentChunk` table. All the data in the column will be lost.
  - You are about to drop the column `semanticType` on the `DocumentChunk` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "DocumentChunk_level_idx";

-- DropIndex
DROP INDEX "DocumentChunk_semanticType_idx";

-- AlterTable
ALTER TABLE "DocumentChunk" DROP COLUMN "level",
DROP COLUMN "semanticType";
