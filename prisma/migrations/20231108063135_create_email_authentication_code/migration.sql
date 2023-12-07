-- AlterTable
ALTER TABLE "User" ALTER COLUMN "plan" SET DEFAULT 'trial';

-- CreateTable
CREATE TABLE "EmailAuthenticationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAuthenticationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailAuthenticationCode_code_key" ON "EmailAuthenticationCode"("code");
