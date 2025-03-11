-- CreateEnum
CREATE TYPE "TaggableItemType" AS ENUM ('LINK', 'DOCUMENT', 'DATAROOM');

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaggedItem" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "itemType" "TaggableItemType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taggedBy" TEXT,
    "linkId" TEXT,
    "documentId" TEXT,
    "dataroomId" TEXT,

    CONSTRAINT "TaggedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tag_teamId_idx" ON "Tag"("teamId");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_id_idx" ON "Tag"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_teamId_name_key" ON "Tag"("teamId", "name");

-- CreateIndex
CREATE INDEX "TaggedItem_itemType_linkId_idx" ON "TaggedItem"("itemType", "linkId");

-- CreateIndex
CREATE INDEX "TaggedItem_itemType_documentId_idx" ON "TaggedItem"("itemType", "documentId");

-- CreateIndex
CREATE INDEX "TaggedItem_itemType_dataroomId_idx" ON "TaggedItem"("itemType", "dataroomId");

-- CreateIndex
CREATE INDEX "TaggedItem_tagId_linkId_idx" ON "TaggedItem"("tagId", "linkId");

-- CreateIndex
CREATE INDEX "TaggedItem_tagId_documentId_idx" ON "TaggedItem"("tagId", "documentId");

-- CreateIndex
CREATE INDEX "TaggedItem_tagId_dataroomId_idx" ON "TaggedItem"("tagId", "dataroomId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaggedItem" ADD CONSTRAINT "TaggedItem_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaggedItem" ADD CONSTRAINT "TaggedItem_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaggedItem" ADD CONSTRAINT "TaggedItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaggedItem" ADD CONSTRAINT "TaggedItem_dataroomId_fkey" FOREIGN KEY ("dataroomId") REFERENCES "Dataroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
