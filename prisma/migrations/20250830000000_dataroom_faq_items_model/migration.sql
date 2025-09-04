-- CreateEnum
CREATE TYPE "FaqStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FaqVisibility" AS ENUM ('PUBLIC_DATAROOM', 'PUBLIC_LINK', 'PUBLIC_DOCUMENT');

-- CreateTable
CREATE TABLE "DataroomFaqItem" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "editedQuestion" TEXT NOT NULL,
    "originalQuestion" TEXT,
    "answer" TEXT NOT NULL,
    "description" TEXT,
    "dataroomId" TEXT NOT NULL,
    "linkId" TEXT,
    "dataroomDocumentId" TEXT,
    "sourceConversationId" TEXT,
    "questionMessageId" TEXT,
    "answerMessageId" TEXT,
    "teamId" TEXT NOT NULL,
    "publishedByUserId" TEXT NOT NULL,
    "visibilityMode" "FaqVisibility" NOT NULL DEFAULT 'PUBLIC_DATAROOM',
    "status" "FaqStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isAnonymized" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documentPageNumber" INTEGER,
    "documentVersionNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataroomFaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataroomFaqItem_createdAt_idx" ON "DataroomFaqItem"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "DataroomFaqItem_dataroomDocumentId_idx" ON "DataroomFaqItem"("dataroomDocumentId" ASC);

-- CreateIndex
CREATE INDEX "DataroomFaqItem_dataroomId_idx" ON "DataroomFaqItem"("dataroomId" ASC);

-- CreateIndex
CREATE INDEX "DataroomFaqItem_linkId_idx" ON "DataroomFaqItem"("linkId" ASC);

-- CreateIndex
CREATE INDEX "DataroomFaqItem_publishedByUserId_idx" ON "DataroomFaqItem"("publishedByUserId" ASC);

-- CreateIndex
CREATE INDEX "DataroomFaqItem_sourceConversationId_idx" ON "DataroomFaqItem"("sourceConversationId" ASC);

-- CreateIndex
CREATE INDEX "DataroomFaqItem_status_idx" ON "DataroomFaqItem"("status" ASC);

-- CreateIndex
CREATE INDEX "DataroomFaqItem_teamId_idx" ON "DataroomFaqItem"("teamId" ASC);

-- CreateIndex
CREATE INDEX "DataroomFaqItem_visibilityMode_idx" ON "DataroomFaqItem"("visibilityMode" ASC);

-- AddForeignKey
ALTER TABLE "DataroomFaqItem" ADD CONSTRAINT "DataroomFaqItem_answerMessageId_fkey" FOREIGN KEY ("answerMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFaqItem" ADD CONSTRAINT "DataroomFaqItem_dataroomDocumentId_fkey" FOREIGN KEY ("dataroomDocumentId") REFERENCES "DataroomDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFaqItem" ADD CONSTRAINT "DataroomFaqItem_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFaqItem" ADD CONSTRAINT "DataroomFaqItem_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFaqItem" ADD CONSTRAINT "DataroomFaqItem_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFaqItem" ADD CONSTRAINT "DataroomFaqItem_questionMessageId_fkey" FOREIGN KEY ("questionMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFaqItem" ADD CONSTRAINT "DataroomFaqItem_sourceConversationId_fkey" FOREIGN KEY ("sourceConversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFaqItem" ADD CONSTRAINT "DataroomFaqItem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

