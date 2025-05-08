-- Add isPublicEmail field to User table
ALTER TABLE "User" ADD COLUMN "isPublicEmail" BOOLEAN NOT NULL DEFAULT false; 