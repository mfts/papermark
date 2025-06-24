CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "View_viewerId_idx" ON "View"("viewerId");

CREATE INDEX IF NOT EXISTS "View_viewedAt_idx" ON "View"("viewedAt" DESC);

CREATE INDEX IF NOT EXISTS "View_viewerId_documentId_idx" ON "View"("viewerId", "documentId");

-- Index for viewer email search
CREATE INDEX IF NOT EXISTS "Viewer_email_trgm_idx" ON "Viewer" USING gin(lower("email") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Viewer_teamId_email_idx" ON "Viewer"("teamId", lower("email"));

-- Additional indexes for sorting optimization
CREATE INDEX IF NOT EXISTS "Viewer_teamId_createdAt_idx" ON "Viewer"("teamId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "View_viewerId_viewedAt_idx" ON "View"("viewerId", "viewedAt" DESC) WHERE "documentId" IS NOT NULL;
