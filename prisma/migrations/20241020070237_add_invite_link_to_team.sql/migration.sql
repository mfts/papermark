-- AlterTable
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'inviteLink') THEN
        ALTER TABLE "Team" DROP COLUMN "inviteLink";
    END IF;
END $$;

ALTER TABLE "Team" ADD COLUMN "inviteLink" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_inviteLink_key" ON "Team"("inviteLink");