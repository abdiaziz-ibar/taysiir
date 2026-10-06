const prisma = require("../lib/prisma");
const nextVoucherNumber = require("./voucherNumber");
const { currentMonthKey, shiftMonth, monthsBetween } = require("./recurring");

// Monthly ("bil kasta") expenses are no longer a feature: every expense is recorded for its own
// month. This runs once at start-up and turns each monthly template that still exists into ordinary
// expenses for the months it covered up to last month (a month that already has an entry for that
// category is left alone), then removes the template. The current month is left unpaid.
const materializeRecurring = async () => {
  const templates = await prisma.recurringExpense.findMany({ orderBy: { startMonth: "asc" } });
  if (templates.length === 0) return;

  const lastMonth = shiftMonth(currentMonthKey(), -1);
  let created = 0;

  for (const template of templates) {
    const end = template.endMonth && template.endMonth < lastMonth ? template.endMonth : lastMonth;
    const months = template.startMonth <= end ? monthsBetween(template.startMonth, end) : [];

    for (const month of months) {
      const [y, m] = month.split("-").map(Number);
      const from = new Date(y, m - 1, 1);
      const to = new Date(y, m, 1);
      const exists = await prisma.expense.findFirst({
        where: { category: { equals: template.category, mode: "insensitive" }, expenseDate: { gte: from, lt: to } },
      });
      if (exists && template.category !== "Kale") continue;

      await prisma.expense.create({
        data: {
          voucherNumber: await nextVoucherNumber("expense", "EXP"),
          category: template.category,
          description: template.description,
          amount: template.amount,
          expenseDate: new Date(y, m - 1, 1, 12),
          paymentMethod: template.paymentMethod,
          notes: template.notes,
          createdById: template.createdById,
        },
      });
      created += 1;
    }
    await prisma.recurringExpense.delete({ where: { id: template.id } });
  }
  console.log(`Kharashyada bil kasta ah waxaa loo beddelay kuwo caadi ah: ${templates.length} nooc, ${created} diiwaan.`);
};

module.exports = materializeRecurring;
