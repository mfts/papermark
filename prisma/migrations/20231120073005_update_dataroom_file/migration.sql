/*
  Warnings:

  - Added the required column `url` to the `DataroomFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DataroomFile" ADD COLUMN     "url" TEXT NOT NULL;
