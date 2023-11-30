-- CreateIndex
CREATE INDEX "Document_ownerId_idx" ON "Document"("ownerId");

-- CreateIndex
CREATE INDEX "Document_teamId_idx" ON "Document"("teamId");

-- CreateIndex
CREATE INDEX "DocumentPage_versionId_idx" ON "DocumentPage"("versionId");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "Domain_userId_idx" ON "Domain"("userId");

-- CreateIndex
CREATE INDEX "Domain_teamId_idx" ON "Domain"("teamId");

-- CreateIndex
CREATE INDEX "Link_documentId_idx" ON "Link"("documentId");

-- CreateIndex
CREATE INDEX "View_linkId_idx" ON "View"("linkId");

-- CreateIndex
CREATE INDEX "View_documentId_idx" ON "View"("documentId");
