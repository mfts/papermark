-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Domain" DROP CONSTRAINT "Domain_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Domain" DROP CONSTRAINT "Domain_userId_fkey";

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "ownerId" DROP NOT NULL,
ALTER COLUMN "teamId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Domain" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "teamId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

