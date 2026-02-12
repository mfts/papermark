-- AlterTable: Add slug and SSO fields to Team
ALTER TABLE "Team" ADD COLUMN "slug" TEXT;
ALTER TABLE "Team" ADD COLUMN "ssoEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Team" ADD COLUMN "ssoEmailDomain" TEXT;
ALTER TABLE "Team" ADD COLUMN "ssoEnforcedAt" TIMESTAMP(3);

-- CreateIndex: unique slug for SSO login
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex: unique email domain for SSO
CREATE UNIQUE INDEX "Team_ssoEmailDomain_key" ON "Team"("ssoEmailDomain");

-- CreateTable: Jackson SAML/SCIM internal tables
CREATE TABLE "jackson_index" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "storeKey" TEXT NOT NULL,

    CONSTRAINT "jackson_index_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jackson_store" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "iv" TEXT,
    "tag" TEXT,
    "namespace" TEXT,
    "createdAt" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(0),

    CONSTRAINT "jackson_store_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "jackson_ttl" (
    "key" TEXT NOT NULL,
    "expiresAt" BIGINT NOT NULL,

    CONSTRAINT "jackson_ttl_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "_jackson_index_key_store" ON "jackson_index"("key", "storeKey");

-- CreateIndex
CREATE INDEX "_jackson_store_namespace" ON "jackson_store"("namespace");

-- CreateIndex
CREATE INDEX "_jackson_ttl_expires_at" ON "jackson_ttl"("expiresAt");
