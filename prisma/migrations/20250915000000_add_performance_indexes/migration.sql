-- CreateIndex
CREATE INDEX "Document_teamId_folderId_idx" ON "Document"("teamId" ASC, "folderId" ASC);

-- CreateIndex
CREATE INDEX "Document_teamId_name_idx" ON "Document"("teamId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_createdAt_idx" ON "DocumentVersion"("documentId" ASC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_isPrimary_idx" ON "DocumentVersion"("documentId" ASC, "isPrimary" ASC);

-- CreateIndex
CREATE INDEX "Link_documentId_isArchived_idx" ON "Link"("documentId" ASC, "isArchived" ASC);

-- CreateIndex
CREATE INDEX "Reaction_viewId_type_idx" ON "Reaction"("viewId" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "View_documentId_isArchived_idx" ON "View"("documentId" ASC, "isArchived" ASC);

-- CreateIndex
CREATE INDEX "View_documentId_viewedAt_idx" ON "View"("documentId" ASC, "viewedAt" DESC);

-- CreateIndex
CREATE INDEX "View_viewerEmail_idx" ON "View"("viewerEmail" ASC);

