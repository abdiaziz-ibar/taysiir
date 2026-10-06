const prisma = require("../lib/prisma");

// The first school year (September) with any finance data: the earliest employee, salary payment,
// expense or monthly entry decides it. Months before that have nothing owed, so reports and the
// payroll sheet leave them empty instead of showing salaries "due" for years the system wasn't used.
// Returns "YYYY-09", or null when nothing has been recorded yet.
const financeStartMonth = async () => {
  const [emp, sal, exp, rec] = await Promise.all([
    prisma.employee.aggregate({ _min: { createdAt: true } }),
    prisma.salaryPayment.aggregate({ _min: { paymentDate: true } }),
    prisma.expense.aggregate({ _min: { expenseDate: true } }),
    prisma.recurringExpense.aggregate({ _min: { startMonth: true } }),
  ]);
  const dates = [emp._min.createdAt, sal._min.paymentDate, exp._min.expenseDate].filter(Boolean);
  const years = dates.map((d) => (d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1));
  if (rec._min.startMonth) {
    const [y, m] = rec._min.startMonth.split("-").map(Number);
    years.push(m >= 9 ? y : y - 1);
  }
  if (years.length === 0) return null;
  return `${Math.min(...years)}-09`;
};

module.exports = financeStartMonth;
