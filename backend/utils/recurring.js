// Recurring monthly expenses: entered once, shown by default every month from
// their start month on. A template applies to month M when startMonth <= M and
// (endMonth is null or endMonth >= M). "YYYY-MM" strings compare correctly as text.

const pad = (n) => String(n).padStart(2, "0");

const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const currentMonthKey = () => monthKey(new Date());

const shiftMonth = (month, delta) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const monthStart = (month) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1);
};

const noonOfFirst = (month) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1, 12);
};

// Every month from `from` to `to`, inclusive.
const monthsBetween = (from, to) => {
  const out = [];
  for (let m = from; m <= to; m = shiftMonth(m, 1)) out.push(m);
  return out;
};

const isRepeatable = (category) => category === "Kale"; // the catch-all category can repeat

const activeIn = (templates, month) => templates.filter((t) => t.startMonth <= month && (!t.endMonth || t.endMonth >= month));

// The rows recurring templates add to a month. A real entry of the same category in
// that month wins over the template (so nothing shows twice), except "Kale".
const recurringRowsFor = (month, templates, concrete) =>
  activeIn(templates, month)
    .filter((t) => isRepeatable(t.category) || !concrete.some((e) => e.category.toLowerCase() === t.category.toLowerCase()))
    .map((t) => ({
      id: `rec:${t.id}:${month}`,
      voucherNumber: null,
      category: t.category,
      description: t.description,
      amount: t.amount,
      expenseDate: noonOfFirst(month), // noon, so it is the 1st in any timezone
      paymentMethod: t.paymentMethod,
      notes: t.notes,
      recurring: true,
      recurringId: t.id,
      projected: month > currentMonthKey(), // a month that hasn't started yet
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

module.exports = { monthKey, currentMonthKey, shiftMonth, monthStart, monthsBetween, isRepeatable, activeIn, recurringRowsFor };
