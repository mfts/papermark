-- CreateEnum
CREATE TYPE "ConversationVisibility" AS ENUM ('PRIVATE', 'PUBLIC_LINK', 'PUBLIC_GROUP', 'PUBLIC_DOCUMENT', 'PUBLIC_DATAROOM');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('OWNER', 'PARTICIPANT');

-- AlterTable
ALTER TABLE "Dataroom" ADD COLUMN     "conversationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "enableConversation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "visibilityMode" "ConversationVisibility" NOT NULL DEFAULT 'PRIVATE',
    "dataroomId" TEXT NOT NULL,
    "dataroomDocumentId" TEXT,
    "documentVersionNumber" INTEGER,
    "documentPageNumber" INTEGER,
    "linkId" TEXT,
    "viewerGroupId" TEXT,
    "initialViewId" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'PARTICIPANT',
    "viewerId" TEXT,
    "userId" TEXT,
    "receiveNotifications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationView" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT,
    "viewerId" TEXT,
    "viewId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_dataroomDocumentId_idx" ON "Conversation"("dataroomDocumentId" ASC);

-- CreateIndex
CREATE INDEX "Conversation_dataroomId_idx" ON "Conversation"("dataroomId" ASC);

-- CreateIndex
CREATE INDEX "Conversation_initialViewId_idx" ON "Conversation"("initialViewId" ASC);

-- CreateIndex
CREATE INDEX "Conversation_linkId_idx" ON "Conversation"("linkId" ASC);

-- CreateIndex
CREATE INDEX "Conversation_teamId_idx" ON "Conversation"("teamId" ASC);

-- CreateIndex
CREATE INDEX "Conversation_viewerGroupId_idx" ON "Conversation"("viewerGroupId" ASC);

-- CreateIndex
CREATE INDEX "ConversationParticipant_conversationId_idx" ON "ConversationParticipant"("conversationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId" ASC, "userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_viewerId_key" ON "ConversationParticipant"("conversationId" ASC, "viewerId" ASC);

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId" ASC);

-- CreateIndex
CREATE INDEX "ConversationParticipant_viewerId_idx" ON "ConversationParticipant"("viewerId" ASC);

-- CreateIndex
CREATE INDEX "ConversationView_conversationId_idx" ON "ConversationView"("conversationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationView_conversationId_viewId_key" ON "ConversationView"("conversationId" ASC, "viewId" ASC);

-- CreateIndex
CREATE INDEX "ConversationView_viewId_idx" ON "ConversationView"("viewId" ASC);

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId" ASC);

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId" ASC);

-- CreateIndex
CREATE INDEX "Message_viewId_idx" ON "Message"("viewId" ASC);

-- CreateIndex
CREATE INDEX "Message_viewerId_idx" ON "Message"("viewerId" ASC);

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_dataroomDocumentId_fkey" FOREIGN KEY ("dataroomDocumentId") REFERENCES "DataroomDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_initialViewId_fkey" FOREIGN KEY ("initialViewId") REFERENCES "View"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_viewerGroupId_fkey" FOREIGN KEY ("viewerGroupId") REFERENCES "ViewerGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationView" ADD CONSTRAINT "ConversationView_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationView" ADD CONSTRAINT "ConversationView_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

