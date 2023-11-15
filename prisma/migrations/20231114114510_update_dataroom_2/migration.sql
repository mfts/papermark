-- AlterTable
ALTER TABLE "Dataroom" ADD COLUMN     "emailProtected" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT;
