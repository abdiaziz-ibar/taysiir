const prisma = require("../lib/prisma");
const { monthKey, currentMonthKey, monthsBetween, monthStart, shiftMonth, recurringRowsFor } = require("../utils/recurring");
const { salaryRowsFor } = require("./salaryController");

// Same Sep→Aug order the other reports use.
const MONTHS = [
  "September", "October", "November", "December",
  "January", "February", "March", "April",
  "May", "June", "July", "August",
];

const currentSchoolYearStart = () => {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
};

// GET /api/finance/summary?startYear=2026
// What the school paid out in one school year (September → August): salaries
// and other expenses, by the date they were paid. Independent of the fees
// system — it doesn't read parents, fees or fee payments.
const getFinanceSummary = async (req, res, next) => {
  try {
    const startYear = req.query.startYear === undefined ? currentSchoolYearStart() : Number(req.query.startYear);
    if (!Number.isInteger(startYear) || startYear < 2000 || startYear > 2100) {
      return res.status(400).json({ message: "Sanadka khalad ah." });
    }

    const start = new Date(startYear, 8, 1);
    const end = new Date(startYear + 1, 8, 1);

    const [salaries, concrete, templates] = await Promise.all([
      prisma.salaryPayment.findMany({ where: { paymentDate: { gte: start, lt: end } }, include: { employee: { select: { type: true } } } }),
      prisma.expense.findMany({ where: { expenseDate: { gte: start, lt: end } } }),
      prisma.recurringExpense.findMany(),
    ]);

    // Monthly (recurring) entries count for each month of the year up to the current one —
    // future months aren't spent yet.
    const expenses = [...concrete];
    const lastMonth = currentMonthKey();
    monthsBetween(monthKey(start), monthKey(new Date(startYear + 1, 7, 1))).forEach((m) => {
      if (m > lastMonth) return;
      expenses.push(...recurringRowsFor(m, templates, concrete.filter((e) => monthKey(e.expenseDate) === m)));
    });

    const months = MONTHS.map((month, idx) => ({ month, monthIndex: (8 + idx) % 12, salaries: 0, teachers: 0, staff: 0, expenses: 0 }));
    const add = (rows, dateKey, field) =>
      rows.forEach((r) => {
        const bucket = months.find((m) => m.monthIndex === new Date(r[dateKey]).getMonth());
        if (bucket) bucket[field] += r.amount;
      });
    add(salaries, "paymentDate", "salaries");
    add(salaries.filter((p) => p.employee.type === "teacher"), "paymentDate", "teachers");
    add(salaries.filter((p) => p.employee.type !== "teacher"), "paymentDate", "staff");
    add(expenses, "expenseDate", "expenses");

    const rows = months.map(({ monthIndex, ...m }) => ({ ...m, total: m.salaries + m.expenses }));
    const total = (key) => rows.reduce((s, r) => s + r[key], 0);

    const byCat = {};
    expenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });

    res.json({
      schoolYear: `${startYear}-${startYear + 1}`,
      startYear,
      months: rows,
      totals: { salaries: total("salaries"), teachers: total("teachers"), staff: total("staff"), expenses: total("expenses"), total: total("total") },
      expensesByCategory: Object.entries(byCat)
        .map(([category, amount]) => ({ category, total: amount }))
        .sort((a, b) => b.total - a.total),
    });
  } catch (err) {
    next(err);
  }
};

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const salaryGroup = (rows) => {
  const due = rows.reduce((s, r) => s + r.monthlySalary, 0);
  const paid = rows.reduce((s, r) => s + r.totalPaid, 0);
  return {
    count: rows.length,
    paidCount: rows.filter((r) => r.status === "paid").length,
    due,
    paid,
    remaining: rows.reduce((s, r) => s + r.balance, 0),
  };
};

// GET /api/finance/month?period=YYYY-MM
// Everything for one month in one place: teachers' and staff salaries (due, paid,
// still to pay) and all other expenses (including monthly recurring ones).
const getMonthOverview = async (req, res, next) => {
  try {
    const period = req.query.period || currentMonthKey();
    if (!MONTH_RE.test(period)) return res.status(400).json({ message: "Bisha waa inay noqotaa qaabka YYYY-MM." });

    const [rows, concrete, templates] = await Promise.all([
      salaryRowsFor(period),
      prisma.expense.findMany({ where: { expenseDate: { gte: monthStart(period), lt: monthStart(shiftMonth(period, 1)) } } }),
      prisma.recurringExpense.findMany(),
    ]);
    const expenses = [...concrete, ...recurringRowsFor(period, templates, concrete)];

    const byCat = {};
    expenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });

    const teachers = salaryGroup(rows.filter((r) => r.employee.type === "teacher"));
    const staff = salaryGroup(rows.filter((r) => r.employee.type !== "teacher"));
    const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0);

    res.json({
      period,
      teachers,
      staff,
      expenses: {
        count: expenses.length,
        total: expensesTotal,
        byCategory: Object.entries(byCat).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total),
      },
      totals: {
        paid: teachers.paid + staff.paid + expensesTotal, // salaries paid + expenses
        salaryDue: teachers.due + staff.due,
        salaryRemaining: teachers.remaining + staff.remaining, // salaries still to be paid
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFinanceSummary, getMonthOverview };
