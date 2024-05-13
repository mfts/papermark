-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "enableQuestion" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackResponse" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "viewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_linkId_key" ON "Feedback"("linkId");

-- CreateIndex
CREATE INDEX "Feedback_linkId_idx" ON "Feedback"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackResponse_viewId_key" ON "FeedbackResponse"("viewId");

-- CreateIndex
CREATE INDEX "FeedbackResponse_feedbackId_idx" ON "FeedbackResponse"("feedbackId");

-- CreateIndex
CREATE INDEX "FeedbackResponse_viewId_idx" ON "FeedbackResponse"("viewId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackResponse" ADD CONSTRAINT "FeedbackResponse_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackResponse" ADD CONSTRAINT "FeedbackResponse_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;

