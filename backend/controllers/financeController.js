const prisma = require("../lib/prisma");

// Same Sep→Aug order the other reports use.
const MONTHS = [
  "September", "October", "November", "December",
  "January", "February", "March", "April",
  "May", "June", "July", "August",
];

// GET /api/finance/summary?academicYearId=
// Money in vs. money out for one school year (September → August).
//  - income:   fee payments belonging to that academic year (same figure as
//              the other reports, even when a parent paid late)
//  - salaries/expenses: by the date they were paid, inside the Sep→Aug window
const getFinanceSummary = async (req, res, next) => {
  try {
    let { academicYearId } = req.query;
    if (!academicYearId) {
      academicYearId = (await prisma.academicYear.findFirst({ where: { isActive: true } }))?.id;
    }
    if (!academicYearId) return res.json(null);

    const year = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
    if (!year) return res.status(404).json({ message: "Sanad Dugsiyeedka lama helin." });

    const start = new Date(year.startYear, 8, 1);
    const end = new Date(year.startYear + 1, 8, 1);

    const [payments, salaries, expenses] = await Promise.all([
      prisma.payment.findMany({ where: { academicYearId } }),
      prisma.salaryPayment.findMany({ where: { paymentDate: { gte: start, lt: end } } }),
      prisma.expense.findMany({ where: { expenseDate: { gte: start, lt: end } } }),
    ]);

    const months = MONTHS.map((month, idx) => ({
      month,
      monthIndex: (8 + idx) % 12,
      income: 0,
      salaries: 0,
      expenses: 0,
    }));
    const add = (rows, dateKey, valueKey, field) =>
      rows.forEach((r) => {
        const bucket = months.find((m) => m.monthIndex === new Date(r[dateKey]).getMonth());
        if (bucket) bucket[field] += r[valueKey];
      });
    add(payments, "paymentDate", "amount", "income");
    add(salaries, "paymentDate", "amount", "salaries");
    add(expenses, "expenseDate", "amount", "expenses");

    const rows = months.map(({ monthIndex, ...m }) => {
      const totalOut = m.salaries + m.expenses;
      return { ...m, totalOut, net: m.income - totalOut };
    });
    const total = (key) => rows.reduce((s, r) => s + r[key], 0);

    const byCat = {};
    expenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });

    res.json({
      academicYear: year.name,
      months: rows,
      totals: {
        income: total("income"),
        salaries: total("salaries"),
        expenses: total("expenses"),
        totalOut: total("totalOut"),
        net: total("net"),
      },
      expensesByCategory: Object.entries(byCat)
        .map(([category, amount]) => ({ category, total: amount }))
        .sort((a, b) => b.total - a.total),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFinanceSummary };
