-- AlterTable
ALTER TABLE "DataroomDocument" ADD COLUMN     "googleDriveFileId" TEXT;

-- AlterTable
ALTER TABLE "DataroomFolder" ADD COLUMN     "googleDriveFolderId" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "googleDriveFileId" TEXT;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "googleDriveFolderId" TEXT;

-- CreateTable
CREATE TABLE "GoogleDriveIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "picture" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "refreshTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleDriveIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoogleDriveIntegration_userId_idx" ON "GoogleDriveIntegration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleDriveIntegration_userId_key" ON "GoogleDriveIntegration"("userId");

-- AddForeignKey
ALTER TABLE "GoogleDriveIntegration" ADD CONSTRAINT "GoogleDriveIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
