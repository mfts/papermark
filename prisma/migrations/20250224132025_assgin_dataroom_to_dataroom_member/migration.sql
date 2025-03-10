/*
  Warnings:

  - Added the required column `role` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "userRole" AS ENUM ('MANAGER', 'MEMBER', 'DATAROOM_MEMBER');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DATAROOM_MEMBER';

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "dataroomId" TEXT[],
ADD COLUMN     "role" "userRole" NOT NULL;

-- CreateTable
CREATE TABLE "UserDataroom" (
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "dataroomId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDataroom_pkey" PRIMARY KEY ("userId","dataroomId")
);

-- CreateIndex
CREATE INDEX "UserDataroom_dataroomId_idx" ON "UserDataroom"("dataroomId");

-- AddForeignKey
ALTER TABLE "UserDataroom" ADD CONSTRAINT "UserDataroom_userId_teamId_fkey" FOREIGN KEY ("userId", "teamId") REFERENCES "UserTeam"("userId", "teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDataroom" ADD CONSTRAINT "UserDataroom_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
