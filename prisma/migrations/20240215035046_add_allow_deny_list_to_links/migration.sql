/*
  Warnings:

  - You are about to drop the column `allowedEmails` on the `Link` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Link" DROP COLUMN "allowedEmails",
ADD COLUMN     "allowList" TEXT[],
ADD COLUMN     "denyList" TEXT[];
