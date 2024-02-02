-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "emailAuthenticated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "View" ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
