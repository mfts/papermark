-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_linkId_fkey";

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

