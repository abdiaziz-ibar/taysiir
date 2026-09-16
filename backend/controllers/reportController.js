const prisma = require("../lib/prisma");
const { serializeFee, serializeParent } = require("../utils/serialize");

const MONTHS = [
  "September", "October", "November", "December",
  "January", "February", "March", "April",
  "May", "June", "July", "August",
];

const getActiveYearId = async () => {
  const active = await prisma.academicYear.findFirst({ where: { isActive: true } });
  return active?.id;
};

// GET /api/reports/dashboard?academicYearId=
const getDashboard = async (req, res, next) => {
  try {
    let { academicYearId } = req.query;
    if (!academicYearId) academicYearId = await getActiveYearId();

    const fees = await prisma.fee.findMany({ where: academicYearId ? { academicYearId } : {} });

    const totalParents = await prisma.parent.count();
    const totalFees = fees.reduce((s, f) => s + f.totalAmount, 0);
    const totalPaid = fees.reduce((s, f) => s + f.totalPaid, 0);
    const totalDebt = fees.reduce((s, f) => s + f.balance, 0);
    const paidCount = fees.filter((f) => f.status === "paid").length;
    const partialCount = fees.filter((f) => f.status === "partial").length;
    const unpaidCount = fees.filter((f) => f.status === "unpaid").length;

    res.json({
      academicYearId: academicYearId || null,
      totalParents,
      totalFees,
      totalPaid,
      totalDebt,
      paidCount,
      partialCount,
      unpaidCount,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/monthly?academicYearId=
const getMonthlyReport = async (req, res, next) => {
  try {
    let { academicYearId } = req.query;
    if (!academicYearId) academicYearId = await getActiveYearId();
    if (!academicYearId) return res.json([]);

    const year = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
    if (!year) return res.status(404).json({ message: "Sanad Dugsiyeedka lama helin." });

    const payments = await prisma.payment.findMany({ where: { academicYearId } });

    const monthBuckets = MONTHS.map((label, idx) => {
      const monthIndex = (8 + idx) % 12;
      return { label, monthIndex, totalPaid: 0, count: 0 };
    });

    // Bucket by month name only (not calendar year): a payment already belongs
    // to this academic year via academicYearId, even if it was paid late
    // (e.g. a parent settling a past year's debt today).
    payments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const bucket = monthBuckets.find((b) => b.monthIndex === d.getMonth());
      if (bucket) {
        bucket.totalPaid += p.amount;
        bucket.count += 1;
      }
    });

    res.json(monthBuckets.map((b) => ({ month: b.label, totalPaid: b.totalPaid, paymentsCount: b.count })));
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/yearly?academicYearId=
const getYearlyReport = async (req, res, next) => {
  try {
    let { academicYearId } = req.query;
    if (!academicYearId) academicYearId = await getActiveYearId();
    if (!academicYearId) return res.json(null);

    const year = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
    if (!year) return res.status(404).json({ message: "Sanad Dugsiyeedka lama helin." });

    const fees = await prisma.fee.findMany({ where: { academicYearId } });
    const totalParents = fees.length;
    const totalFees = fees.reduce((s, f) => s + f.totalAmount, 0);
    const totalPaid = fees.reduce((s, f) => s + f.totalPaid, 0);
    const totalDebt = fees.reduce((s, f) => s + f.balance, 0);
    const collectionRate = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

    const payments = await prisma.payment.findMany({ where: { academicYearId } });
    const monthBuckets = MONTHS.map((label, idx) => {
      const monthIndex = (8 + idx) % 12;
      return { label, monthIndex, paid: 0 };
    });
    payments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const bucket = monthBuckets.find((b) => b.monthIndex === d.getMonth());
      if (bucket) bucket.paid += p.amount;
    });

    let cumulative = 0;
    const monthly = monthBuckets.map((b) => {
      cumulative += b.paid;
      return { month: b.label, fees: totalFees, paid: b.paid, balance: Math.max(totalFees - cumulative, 0) };
    });

    res.json({
      academicYear: year.name,
      totalParents,
      totalFees,
      totalPaid,
      totalDebt,
      collectionRate: Math.round(collectionRate * 100) / 100,
      monthly,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/all-years  (totals per academic year, so every year can be compared in one place)
const getAllYearsReport = async (req, res, next) => {
  try {
    const years = await prisma.academicYear.findMany({ orderBy: { startYear: "asc" } });
    const fees = await prisma.fee.findMany();

    const rows = years.map((year) => {
      const yearFees = fees.filter((f) => f.academicYearId === year.id);
      const totalFees = yearFees.reduce((s, f) => s + f.totalAmount, 0);
      const totalPaid = yearFees.reduce((s, f) => s + f.totalPaid, 0);
      const totalDebt = yearFees.reduce((s, f) => s + f.balance, 0);
      const collectionRate = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

      return {
        academicYearId: year.id,
        academicYear: year.name,
        isActive: year.isActive,
        totalParents: yearFees.length,
        totalFees,
        totalPaid,
        totalDebt,
        collectionRate: Math.round(collectionRate * 100) / 100,
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        totalFees: acc.totalFees + r.totalFees,
        totalPaid: acc.totalPaid + r.totalPaid,
        totalDebt: acc.totalDebt + r.totalDebt,
      }),
      { totalFees: 0, totalPaid: 0, totalDebt: 0 }
    );

    res.json({ years: rows, totals });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/parents-summary  (per parent: totals summed across every academic year, in one place)
const getParentsSummaryReport = async (req, res, next) => {
  try {
    const parents = await prisma.parent.findMany({ orderBy: { fullName: "asc" } });
    const fees = await prisma.fee.findMany();

    const rows = parents.map((parent) => {
      const parentFees = fees.filter((f) => f.parentId === parent.id);
      const totalFees = parentFees.reduce((s, f) => s + f.totalAmount, 0);
      const totalPaid = parentFees.reduce((s, f) => s + f.totalPaid, 0);
      const totalDebt = parentFees.reduce((s, f) => s + f.balance, 0);

      return {
        parentId: parent.id,
        parentCode: parent.parentId,
        fullName: parent.fullName,
        phone: parent.phone,
        yearsCount: parentFees.length,
        totalFees,
        totalPaid,
        totalDebt,
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        totalFees: acc.totalFees + r.totalFees,
        totalPaid: acc.totalPaid + r.totalPaid,
        totalDebt: acc.totalDebt + r.totalDebt,
      }),
      { totalFees: 0, totalPaid: 0, totalDebt: 0 }
    );

    res.json({ parents: rows, totals });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/debts?academicYearId=
const getDebtsReport = async (req, res, next) => {
  try {
    let { academicYearId } = req.query;
    if (!academicYearId) academicYearId = await getActiveYearId();

    const where = { balance: { gt: 0 } };
    if (academicYearId) where.academicYearId = academicYearId;

    const fees = await prisma.fee.findMany({
      where,
      include: { parent: true, academicYear: true },
      orderBy: { balance: "desc" },
    });

    const totalDebt = fees.reduce((s, f) => s + f.balance, 0);
    res.json({ totalDebt, debts: fees.map(serializeFee) });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/parent/:id
const getParentReport = async (req, res, next) => {
  try {
    const parent = await prisma.parent.findUnique({ where: { id: req.params.id } });
    if (!parent) return res.status(404).json({ message: "Waalidka lama helin." });

    const fees = await prisma.fee.findMany({
      where: { parentId: parent.id },
      include: { academicYear: true },
      orderBy: { createdAt: "desc" },
    });
    const payments = await prisma.payment.findMany({
      where: { parentId: parent.id },
      include: { academicYear: true },
      orderBy: { paymentDate: "desc" },
    });

    res.json({
      parent: serializeParent(parent),
      fees: fees.map(serializeFee),
      payments: payments.map((p) => {
        const { academicYear, ...rest } = p;
        const { id, ...paymentRest } = rest;
        return { _id: id, ...paymentRest, academicYearId: { _id: academicYear.id, name: academicYear.name } };
      }),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getMonthlyReport,
  getYearlyReport,
  getAllYearsReport,
  getParentsSummaryReport,
  getDebtsReport,
  getParentReport,
};
