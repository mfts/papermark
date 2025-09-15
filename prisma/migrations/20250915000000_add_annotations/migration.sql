-- CreateTable
CREATE TABLE "AnnotationImage" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "mimeType" TEXT,
    "annotationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnotationImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAnnotation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "pages" INTEGER[],
    "documentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnotationImage_annotationId_idx" ON "AnnotationImage"("annotationId" ASC);

-- CreateIndex
CREATE INDEX "DocumentAnnotation_createdById_idx" ON "DocumentAnnotation"("createdById" ASC);

-- CreateIndex
CREATE INDEX "DocumentAnnotation_documentId_idx" ON "DocumentAnnotation"("documentId" ASC);

-- CreateIndex
CREATE INDEX "DocumentAnnotation_teamId_idx" ON "DocumentAnnotation"("teamId" ASC);

-- AddForeignKey
ALTER TABLE "AnnotationImage" ADD CONSTRAINT "AnnotationImage_annotationId_fkey" FOREIGN KEY ("annotationId") REFERENCES "DocumentAnnotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAnnotation" ADD CONSTRAINT "DocumentAnnotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAnnotation" ADD CONSTRAINT "DocumentAnnotation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAnnotation" ADD CONSTRAINT "DocumentAnnotation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

