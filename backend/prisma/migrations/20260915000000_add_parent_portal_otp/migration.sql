-- AlterTable
ALTER TABLE "parents" ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "parents_email_key" ON "parents"("email");

