/*
  Warnings:

  - The `expiresIn` column on the `LinkPreset` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "LinkPreset" DROP COLUMN "expiresIn",
ADD COLUMN     "expiresIn" JSONB;
