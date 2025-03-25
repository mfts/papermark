-- AlterTable
ALTER TABLE "ViewerGroup" ADD COLUMN     "allowAll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "domains" TEXT[];

