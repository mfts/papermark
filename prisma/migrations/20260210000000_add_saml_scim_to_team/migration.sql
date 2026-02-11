-- AlterTable: Add SAML/SCIM fields to Team
ALTER TABLE "Team" ADD COLUMN "samlEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Team" ADD COLUMN "samlProvider" TEXT;
ALTER TABLE "Team" ADD COLUMN "samlConnectionId" TEXT;
ALTER TABLE "Team" ADD COLUMN "scimEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Team" ADD COLUMN "scimProvider" TEXT;
ALTER TABLE "Team" ADD COLUMN "scimDirectoryId" TEXT;

-- CreateTable: Jackson SAML/SCIM internal tables
CREATE TABLE "jackson_index" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(250) NOT NULL,
    "storeKey" VARCHAR(250) NOT NULL,

    CONSTRAINT "jackson_index_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jackson_store" (
    "key" VARCHAR(250) NOT NULL,
    "value" TEXT NOT NULL,
    "iv" VARCHAR(64),
    "tag" VARCHAR(64),
    "namespace" VARCHAR(64),
    "createdAt" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(0),

    CONSTRAINT "jackson_store_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "jackson_ttl" (
    "key" VARCHAR(250) NOT NULL,
    "expiresAt" BIGINT NOT NULL,

    CONSTRAINT "jackson_ttl_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "_jackson_index_key_store" ON "jackson_index"("key", "storeKey");

-- CreateIndex
CREATE INDEX "_jackson_store_namespace" ON "jackson_store"("namespace");

-- CreateIndex
CREATE INDEX "_jackson_ttl_expires_at" ON "jackson_ttl"("expiresAt");
