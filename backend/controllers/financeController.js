const prisma = require("../lib/prisma");
const { monthKey, currentMonthKey, monthsBetween, monthStart, shiftMonth, recurringRowsFor } = require("../utils/recurring");
const { salaryRowsFor } = require("./salaryController");
const { inactiveNames } = require("./expenseCategoryController");

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

// The regular categories (not "Kale") used in an earlier month that have nothing recorded for `period`
// (real or monthly-recurring). Only names and a count: what they would cost isn't known, so no amount is made up.
// `concrete` is every real expense up to the end of the period.
const unpaidExpenses = (period, concrete, templates, hidden = new Set()) => {
  const expected = new Map();
  concrete.forEach((e) => {
    if (e.category !== "Kale" && monthKey(e.expenseDate) < period) expected.set(e.category.toLowerCase(), e.category);
  });
  templates.forEach((t) => {
    if (t.category !== "Kale" && t.startMonth < period) expected.set(t.category.toLowerCase(), t.category);
  });
  const paidNow = new Set([
    ...concrete.filter((e) => monthKey(e.expenseDate) === period).map((e) => e.category.toLowerCase()),
    ...recurringRowsFor(period, templates, []).map((r) => r.category.toLowerCase()),
  ]);
  const categories = [...expected].filter(([key]) => !paidNow.has(key) && !hidden.has(key)).map(([, name]) => name);
  return { count: categories.length, categories };
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
    const history = await prisma.expense.findMany({ where: { expenseDate: { lt: monthStart(shiftMonth(period, 1)) } } });
    const unpaidExp = period > currentMonthKey() ? { count: 0, categories: [] } : unpaidExpenses(period, history, templates, await inactiveNames());

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
        unpaid: unpaidExp,
        byCategory: Object.entries(byCat).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total),
      },
      totals: {
        paid: teachers.paid + staff.paid + expensesTotal, // salaries paid + expenses
        salaryDue: teachers.due + staff.due,
        salaryRemaining: teachers.remaining + staff.remaining, // salaries still to be paid
        unpaid: teachers.remaining + staff.remaining, // salaries still to pay (expenses have no fixed amount owed)
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/finance/year?startYear=2026
// A school year (September → August) month by month, for the Dashboard and the Total report:
// salaries (teachers / staff: due, paid, still to pay) and expenses, plus what has gone out in
// all and what is still unpaid. Months that haven't started yet are listed empty.
const getYearOverview = async (req, res, next) => {
  try {
    const startYear = req.query.startYear === undefined ? currentSchoolYearStart() : Number(req.query.startYear);
    if (!Number.isInteger(startYear) || startYear < 2000 || startYear > 2100) {
      return res.status(400).json({ message: "Sanadka khalad ah." });
    }

    const first = `${startYear}-09`;
    const periods = monthsBetween(first, `${startYear + 1}-08`);
    const now = currentMonthKey();

    const [concrete, templates] = await Promise.all([
      prisma.expense.findMany({ where: { expenseDate: { lt: monthStart(`${startYear + 1}-09`) } } }), // earlier years feed the "unpaid" list
      prisma.recurringExpense.findMany(),
    ]);

    const hidden = await inactiveNames();
    const byCat = {};
    const months = [];
    for (let i = 0; i < periods.length; i += 1) {
      const period = periods[i];
      const future = period > now;
      const empty = { count: 0, paidCount: 0, due: 0, paid: 0, remaining: 0 };
      let teachers = empty;
      let staff = empty;
      let expenseRows = [];
      let unpaidExp = { count: 0, categories: [] };
      if (!future) {
        const rows = await salaryRowsFor(period);
        teachers = salaryGroup(rows.filter((r) => r.employee.type === "teacher"));
        staff = salaryGroup(rows.filter((r) => r.employee.type !== "teacher"));
        const own = concrete.filter((e) => monthKey(e.expenseDate) === period);
        expenseRows = [...own, ...recurringRowsFor(period, templates, own)];
        unpaidExp = unpaidExpenses(period, concrete, templates, hidden);
      }
      expenseRows.forEach((e) => {
        byCat[e.category] = (byCat[e.category] || 0) + e.amount;
      });
      const expenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);
      months.push({
        period,
        month: MONTHS[i],
        future,
        teachers,
        staff,
        salaryDue: teachers.due + staff.due,
        salaryPaid: teachers.paid + staff.paid,
        salaryRemaining: teachers.remaining + staff.remaining,
        expenses,
        expenseUnpaid: unpaidExp,
        paid: teachers.paid + staff.paid + expenses,
        unpaid: teachers.remaining + staff.remaining,
      });
    }

    const sum = (pick) => months.reduce((s, m) => s + pick(m), 0);
    res.json({
      schoolYear: `${startYear}-${startYear + 1}`,
      startYear,
      currentPeriod: now,
      months,
      totals: {
        teachersPaid: sum((m) => m.teachers.paid),
        teachersDue: sum((m) => m.teachers.due),
        teachersRemaining: sum((m) => m.teachers.remaining),
        staffPaid: sum((m) => m.staff.paid),
        staffDue: sum((m) => m.staff.due),
        staffRemaining: sum((m) => m.staff.remaining),
        salaryDue: sum((m) => m.salaryDue),
        salaryPaid: sum((m) => m.salaryPaid),
        salaryRemaining: sum((m) => m.salaryRemaining),
        expenses: sum((m) => m.expenses),
        expenseUnpaidCount: sum((m) => m.expenseUnpaid.count),
        paid: sum((m) => m.paid),
        unpaid: sum((m) => m.unpaid),
      },
      expensesByCategory: Object.entries(byCat)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFinanceSummary, getMonthOverview, getYearOverview };
