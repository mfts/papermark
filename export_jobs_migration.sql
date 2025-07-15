-- Migration: Add Export Jobs Table
-- This file adds the necessary tables and enums for the export visits background task system

-- Create the ExportStatus enum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Create the ExportJob table
CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "resourceId" TEXT NOT NULL,
    "resourceName" TEXT,
    "groupId" TEXT,
    "result" TEXT,
    "error" TEXT,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX "ExportJob_userId_idx" ON "ExportJob"("userId");
CREATE INDEX "ExportJob_teamId_idx" ON "ExportJob"("teamId");
CREATE INDEX "ExportJob_status_idx" ON "ExportJob"("status");
CREATE INDEX "ExportJob_createdAt_idx" ON "ExportJob"("createdAt");

-- Add foreign key constraints
ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update the default timestamp for updatedAt
ALTER TABLE "ExportJob" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;