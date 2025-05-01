/*
  Warnings:

  - The `expiresIn` column on the `LinkPreset` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "LinkPreset" ADD COLUMN     "enableScreenshotProtection" BOOLEAN DEFAULT false,
DROP COLUMN "expiresIn",
ADD COLUMN     "expiresIn" JSONB;
