const prisma = require("../lib/prisma");

// Sequential voucher numbers like SAL-2026-00001. Based on the highest number
// already in use rather than a row count: count() reuses a number (and trips
// the unique constraint) as soon as any earlier row has been deleted.
const nextVoucherNumber = async (model, letters) => {
  const prefix = `${letters}-${new Date().getFullYear()}-`;
  const last = await prisma[model].findFirst({
    where: { voucherNumber: { startsWith: prefix } },
    orderBy: { voucherNumber: "desc" },
    select: { voucherNumber: true },
  });
  const lastNum = last ? parseInt(last.voucherNumber.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastNum + 1).padStart(5, "0")}`;
};

module.exports = nextVoucherNumber;
