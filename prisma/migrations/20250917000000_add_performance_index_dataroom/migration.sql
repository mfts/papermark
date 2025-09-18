-- CreateIndex
CREATE INDEX "DataroomDocument_documentId_idx" ON "DataroomDocument"("documentId" ASC);

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_isPrimary_createdAt_idx" ON "DocumentVersion"("documentId" ASC, "isPrimary" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Link_permissionGroupId_idx" ON "Link"("permissionGroupId" ASC);

-- CreateIndex
CREATE INDEX "ViewerGroup_dataroomId_createdAt_idx" ON "ViewerGroup"("dataroomId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "View_groupId_idx" ON "View"("groupId" ASC);