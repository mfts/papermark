-- Add contentType field to Agreement table
-- This field determines whether content is a LINK (URL) or TEXT (paragraph)
ALTER TABLE "Agreement" ADD COLUMN "contentType" TEXT NOT NULL DEFAULT 'LINK';

-- Update existing agreements to have contentType as LINK since they currently store URLs
UPDATE "Agreement" SET "contentType" = 'LINK' WHERE "contentType" IS NULL OR "contentType" = '';