-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('SENT', 'FAILED', 'BOUNCED');

-- CreateTable
CREATE TABLE "ViewerInvitation" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "groupId" TEXT,
    "invitedBy" TEXT NOT NULL,
    "customMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "InvitationStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewerInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ViewerInvitation_viewerId_idx" ON "ViewerInvitation"("viewerId" ASC);

-- CreateIndex
CREATE INDEX "ViewerInvitation_linkId_idx" ON "ViewerInvitation"("linkId" ASC);

-- CreateIndex
CREATE INDEX "ViewerInvitation_groupId_idx" ON "ViewerInvitation"("groupId" ASC);

-- AddForeignKey
ALTER TABLE "ViewerInvitation" ADD CONSTRAINT "ViewerInvitation_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewerInvitation" ADD CONSTRAINT "ViewerInvitation_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewerInvitation" ADD CONSTRAINT "ViewerInvitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ViewerGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;


