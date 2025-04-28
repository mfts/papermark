-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('LINK_TAG', 'DOCUMENT_TAG', 'DATAROOM_TAG');

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagItem" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "linkId" TEXT,
    "documentId" TEXT,
    "dataroomId" TEXT,
    "taggedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemType" "TagType" NOT NULL,

    CONSTRAINT "TagItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tag_id_idx" ON "Tag"("id" ASC);

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name" ASC);

-- CreateIndex
CREATE INDEX "Tag_teamId_idx" ON "Tag"("teamId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_teamId_name_key" ON "Tag"("teamId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "TagItem_tagId_dataroomId_idx" ON "TagItem"("tagId" ASC, "dataroomId" ASC);

-- CreateIndex
CREATE INDEX "TagItem_tagId_documentId_idx" ON "TagItem"("tagId" ASC, "documentId" ASC);

-- CreateIndex
CREATE INDEX "TagItem_tagId_linkId_idx" ON "TagItem"("tagId" ASC, "linkId" ASC);

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagItem" ADD CONSTRAINT "TagItem_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagItem" ADD CONSTRAINT "TagItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagItem" ADD CONSTRAINT "TagItem_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagItem" ADD CONSTRAINT "TagItem_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

