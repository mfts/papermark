-- CreateTable
CREATE TABLE "HierarchicalDataroom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emailProtected" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "homeFolderId" TEXT NOT NULL,

    CONSTRAINT "HierarchicalDataroom_pkey" PRIMARY KEY ("id")
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
    "parentFolderId" TEXT NOT NULL,
    "dataroomId" TEXT NOT NULL,

    CONSTRAINT "DataroomFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HierarchicalDataroomView" (
    "id" TEXT NOT NULL,
    "dataroomId" TEXT NOT NULL,
    "viewerEmail" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HierarchicalDataroomView_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HierarchicalDataroom" ADD CONSTRAINT "HierarchicalDataroom_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFolder" ADD CONSTRAINT "DataroomFolder_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "HierarchicalDataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFile" ADD CONSTRAINT "DataroomFile_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "DataroomFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataroomFile" ADD CONSTRAINT "DataroomFile_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "HierarchicalDataroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HierarchicalDataroomView" ADD CONSTRAINT "HierarchicalDataroomView_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "HierarchicalDataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
