/*
  Warnings:

  - A unique constraint covering the columns `[email,teamId]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Invitation_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_email_teamId_key" ON "Invitation"("email", "teamId");
