-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_createdById_fkey";

-- DropForeignKey
ALTER TABLE "salary_payments" DROP CONSTRAINT "salary_payments_createdById_fkey";

-- CreateTable
CREATE TABLE "finance_users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_users_username_key" ON "finance_users"("username");

-- Rows created before this migration point at `users`, which no longer applies
-- (finance entries are now made by finance_users), so clear the reference.
UPDATE "salary_payments" SET "createdById" = NULL;
UPDATE "expenses" SET "createdById" = NULL;

-- AddForeignKey
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "finance_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "finance_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

