const prisma = require("../lib/prisma");

// Generates sequential receipt numbers like REC-2026-00001
const generateReceiptNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `REC-${year}-`;
  const count = await prisma.payment.count({
    where: { receiptNumber: { startsWith: prefix } },
  });
  const next = String(count + 1).padStart(5, "0");
  return `${prefix}${next}`;
};

module.exports = generateReceiptNumber;
