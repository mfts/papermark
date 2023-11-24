/*
  Warnings:

  - You are about to drop the `EmailAuthenticationCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "EmailAuthenticationCode";

-- DropEnum
DROP TYPE "AuthenticationCodeType";

-- CreateTable
CREATE TABLE "AuthenticationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "permanent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthenticationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthenticationCode_code_key" ON "AuthenticationCode"("code");

-- AddForeignKey
ALTER TABLE "AuthenticationCode" ADD CONSTRAINT "dataroom_relation" FOREIGN KEY ("identifier") REFERENCES "Dataroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthenticationCode" ADD CONSTRAINT "document_relation" FOREIGN KEY ("identifier") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
