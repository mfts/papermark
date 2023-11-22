-- AddForeignKey
ALTER TABLE "DataroomFolder" ADD CONSTRAINT "DataroomFolder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "DataroomFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
