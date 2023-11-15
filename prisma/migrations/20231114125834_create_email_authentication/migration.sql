-- CreateEnum
CREATE TYPE "AuthenticationCodeType" AS ENUM ('DOCUMENT', 'DATAROOM');

-- CreateTable
CREATE TABLE "EmailAuthenticationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "type" "AuthenticationCodeType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAuthenticationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailAuthenticationCode_code_key" ON "EmailAuthenticationCode"("code");
