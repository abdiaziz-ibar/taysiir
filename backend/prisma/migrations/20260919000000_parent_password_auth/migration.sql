-- AlterTable
ALTER TABLE "parents" DROP COLUMN "otpCode",
DROP COLUMN "otpExpiresAt",
ADD COLUMN     "password" TEXT;
