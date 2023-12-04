-- CreateEnum
CREATE TYPE "DataroomType" AS ENUM ('HIERARCHICAL', 'PAGED');

-- CreateTable
CREATE TABLE "Dataroom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DataroomType" NOT NULL,
    "description" TEXT,
    "emailProtected" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "Dataroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataroomView" (
    "id" TEXT NOT NULL,
    "dataroomId" TEXT NOT NULL,
    "viewerEmail" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataroomView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataroomFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentFolderId" TEXT,
    "dataroomId" TEXT NOT NULL,

    CONSTRAINT "DataroomFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataroomFile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "parentFolderId" TEXT,
    "dataroomId" TEXT NOT NULL,

    CONSTRAINT "DataroomFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthenticationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "permanent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthenticationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthenticationCode_code_key" ON "AuthenticationCode"("code");

-- AddForeignKey
ALTER TABLE "Dataroom" ADD CONSTRAINT "Dataroom_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataroom" ADD CONSTRAINT "Dataroom_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomView" ADD CONSTRAINT "DataroomView_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFolder" ADD CONSTRAINT "DataroomFolder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "DataroomFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFolder" ADD CONSTRAINT "DataroomFolder_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFile" ADD CONSTRAINT "DataroomFile_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "DataroomFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFile" ADD CONSTRAINT "DataroomFile_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthenticationCode" ADD CONSTRAINT "dataroom_relation" FOREIGN KEY ("identifier") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthenticationCode" ADD CONSTRAINT "document_relation" FOREIGN KEY ("identifier") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
