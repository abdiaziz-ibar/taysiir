-- CreateTable
CREATE TABLE "payment_proofs" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "paymentId" TEXT,
    "screenshotUrl" TEXT,
    "amount" DOUBLE PRECISION,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_proof_messages" (
    "id" TEXT NOT NULL,
    "proofId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_proof_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proof_messages" ADD CONSTRAINT "payment_proof_messages_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "payment_proofs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

