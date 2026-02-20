-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "redirectUrl" TEXT;

-- Backfill existing hardcoded root domain redirects
UPDATE "Domain" SET "redirectUrl" = 'https://guide.permithealth.com/faq' WHERE "slug" = 'guide.permithealth.com';
UPDATE "Domain" SET "redirectUrl" = 'https://tradeair.in/sv-fm-inbound' WHERE "slug" = 'fund.tradeair.in';
UPDATE "Domain" SET "redirectUrl" = 'https://www.pashupaticapital.com/' WHERE "slug" = 'docs.pashupaticapital.com';
UPDATE "Domain" SET "redirectUrl" = 'https://partners.braxtech.net/investors' WHERE "slug" = 'partners.braxtech.net';
UPDATE "Domain" SET "redirectUrl" = 'https://research.elazaradvisors.com/root' WHERE "slug" = 'research.elazaradvisors.com';
