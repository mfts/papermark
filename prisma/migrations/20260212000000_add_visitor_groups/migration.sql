-- CreateTable
CREATE TABLE "VisitorGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emails" TEXT[],
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitorGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkVisitorGroup" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "visitorGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkVisitorGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitorGroup_teamId_idx" ON "VisitorGroup"("teamId");

-- CreateIndex
CREATE INDEX "LinkVisitorGroup_linkId_idx" ON "LinkVisitorGroup"("linkId");

-- CreateIndex
CREATE INDEX "LinkVisitorGroup_visitorGroupId_idx" ON "LinkVisitorGroup"("visitorGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkVisitorGroup_linkId_visitorGroupId_key" ON "LinkVisitorGroup"("linkId", "visitorGroupId");

-- AddForeignKey
ALTER TABLE "VisitorGroup" ADD CONSTRAINT "VisitorGroup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkVisitorGroup" ADD CONSTRAINT "LinkVisitorGroup_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkVisitorGroup" ADD CONSTRAINT "LinkVisitorGroup_visitorGroupId_fkey" FOREIGN KEY ("visitorGroupId") REFERENCES "VisitorGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
