-- CreateEnum
CREATE TYPE "ProposedQuestionStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "DataroomProposedQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "dataroomId" TEXT NOT NULL,
    "linkId" TEXT,
    "dataroomDocumentId" TEXT,
    "teamId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "status" "ProposedQuestionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataroomProposedQuestion_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "proposedQuestionId" TEXT;

-- CreateIndex
CREATE INDEX "DataroomProposedQuestion_dataroomId_idx" ON "DataroomProposedQuestion"("dataroomId");

-- CreateIndex
CREATE INDEX "DataroomProposedQuestion_linkId_idx" ON "DataroomProposedQuestion"("linkId");

-- CreateIndex
CREATE INDEX "DataroomProposedQuestion_dataroomDocumentId_idx" ON "DataroomProposedQuestion"("dataroomDocumentId");

-- CreateIndex
CREATE INDEX "DataroomProposedQuestion_teamId_idx" ON "DataroomProposedQuestion"("teamId");

-- CreateIndex
CREATE INDEX "DataroomProposedQuestion_createdByUserId_idx" ON "DataroomProposedQuestion"("createdByUserId");

-- CreateIndex
CREATE INDEX "Conversation_proposedQuestionId_idx" ON "Conversation"("proposedQuestionId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_proposedQuestionId_fkey" FOREIGN KEY ("proposedQuestionId") REFERENCES "DataroomProposedQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomProposedQuestion" ADD CONSTRAINT "DataroomProposedQuestion_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomProposedQuestion" ADD CONSTRAINT "DataroomProposedQuestion_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomProposedQuestion" ADD CONSTRAINT "DataroomProposedQuestion_dataroomDocumentId_fkey" FOREIGN KEY ("dataroomDocumentId") REFERENCES "DataroomDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomProposedQuestion" ADD CONSTRAINT "DataroomProposedQuestion_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomProposedQuestion" ADD CONSTRAINT "DataroomProposedQuestion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
