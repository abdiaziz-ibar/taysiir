const prisma = require("../lib/prisma");
const nextVoucherNumber = require("../utils/voucherNumber");
const { serializeExpense } = require("../utils/serialize");
const { monthKey, currentMonthKey, shiftMonth, monthStart, monthsBetween, isRepeatable, activeIn, recurringRowsFor } = require("../utils/recurring");

const METHODS = ["Cash", "Mobile Money", "Bank", "Other"];
const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

const badRequest = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

const monthLabel = (month) => monthStart(month).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

const requireMonth = (value) => {
  if (!MONTH_RE.test(value || "")) throw badRequest("Bisha waa inay noqotaa qaabka YYYY-MM.");
  return value;
};

// A description must be actual text: at least 3 characters with at least one
// letter — a bare number like "2222" is rejected.
const validateDescription = (text) => {
  if (text.length < 3) throw badRequest("Sharaxaadda aad bay u gaaban tahay (ugu yaraan 3 xaraf).");
  if (!/\p{L}/u.test(text)) throw badRequest("Sharaxaadda waa inay noqotaa qoraal (ereyo), ma aha lambar kaliya.");
};

// Every category except "Kale" is a regular cost recorded once per month (to change it, edit the
// existing entry). A real entry and a recurring one both take that slot.
const assertOncePerMonth = async (category, date, { excludeId, checkRecurring }) => {
  if (isRepeatable(category)) return;
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const existing = await prisma.expense.findFirst({
    where: {
      category: { equals: category, mode: "insensitive" },
      expenseDate: { gte: start, lt: end },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  if (existing) {
    throw badRequest(
      `"${category}" bisha ${monthLabel(monthKey(start))} horey ayaa loo diiwaan geliyay (${existing.voucherNumber}, $${existing.amount}). Fadlan Edit ka samee kii hore, ama dooro bil kale.`
    );
  }
  if (checkRecurring) await assertNoRecurringClash(category, monthKey(start));
};

// Only one recurring entry per category can be live from a month onward.
const assertNoRecurringClash = async (category, fromMonth, excludeId) => {
  if (isRepeatable(category)) return;
  const clash = await prisma.recurringExpense.findFirst({
    where: {
      category: { equals: category, mode: "insensitive" },
      OR: [{ endMonth: null }, { endMonth: { gte: fromMonth } }],
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  if (clash) {
    throw badRequest(
      `"${category}" horey ayaa loo dejiyay sida kharash bil kasta ah (${clash.description}, $${clash.amount}). Fadlan Edit ka samee kii hore.`
    );
  }
};

const parseFields = (body, { partial }) => {
  const out = {};
  const has = (k) => body[k] !== undefined;

  if (has("category") || !partial) {
    const category = String(body.category || "").trim();
    if (!category) throw badRequest("Fadlan dooro nooca kharashka.");
    if (category.length > 60) throw badRequest("Nooca kharashka aad buu u dheer yahay.");
    out.category = category;
  }
  if (has("description") || !partial) {
    const description = String(body.description || "").trim();
    if (!description) throw badRequest("Fadlan sharax kharashka.");
    validateDescription(description);
    out.description = description;
  }
  if (has("amount") || !partial) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw badRequest("Lacagta waa inay ka weyn tahay 0.");
    out.amount = amount;
  }
  if (has("paymentMethod") || !partial) {
    if (!METHODS.includes(body.paymentMethod)) throw badRequest("Habka lacag bixinta khalad ah.");
    out.paymentMethod = body.paymentMethod;
  }
  if (has("expenseDate") && body.expenseDate) {
    const d = new Date(body.expenseDate);
    if (Number.isNaN(d.getTime())) throw badRequest("Taariikhda khalad ah.");
    out.expenseDate = d;
  }
  if (has("notes")) out.notes = body.notes ? String(body.notes).trim() || null : null;
  return out;
};

const isTrue = (v) => v === true || v === "true";

const recurringRow = (template, month) => serializeExpense(recurringRowsFor(month, [template], [])[0]);

// GET /api/expenses?month=YYYY-MM&category=&search=
// Real entries plus the recurring ones that apply (a month with no month filter lists
// every month up to the current one). Returns the rows, the total and a per-category breakdown.
const getExpenses = async (req, res, next) => {
  try {
    const { month, category, search } = req.query;
    if (month) requireMonth(month);

    const where = {};
    if (month) where.expenseDate = { gte: monthStart(month), lt: monthStart(shiftMonth(month, 1)) };

    const [concrete, templates] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { expenseDate: "desc" } }),
      prisma.recurringExpense.findMany(),
    ]);

    let rows = [...concrete];
    if (month) {
      rows.push(...recurringRowsFor(month, templates, concrete));
    } else if (templates.length) {
      const first = templates.map((t) => t.startMonth).sort()[0];
      monthsBetween(first, currentMonthKey()).forEach((m) => {
        rows.push(...recurringRowsFor(m, templates, concrete.filter((e) => monthKey(e.expenseDate) === m)));
      });
    }

    if (category) rows = rows.filter((e) => e.category === category);
    if (search) rows = rows.filter((e) => e.description.toLowerCase().includes(String(search).toLowerCase()));
    rows.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate) || a.description.localeCompare(b.description));

    const byCat = {};
    rows.forEach((e) => {
      byCat[e.category] = byCat[e.category] || { category: e.category, total: 0, count: 0 };
      byCat[e.category].total += e.amount;
      byCat[e.category].count += 1;
    });

    res.json({
      expenses: rows.map(serializeExpense),
      total: rows.reduce((s, e) => s + e.amount, 0),
      byCategory: Object.values(byCat).sort((a, b) => b.total - a.total),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/expenses  { ..., recurring? }
// recurring: true makes it a monthly entry that starts at the month of expenseDate.
const createExpense = async (req, res, next) => {
  try {
    const data = parseFields(req.body, { partial: false });
    const date = data.expenseDate || new Date();

    if (isTrue(req.body.recurring)) {
      const startMonth = monthKey(date);
      await assertOncePerMonth(data.category, date, { checkRecurring: false });
      await assertNoRecurringClash(data.category, startMonth);
      const { expenseDate, ...fields } = data;
      const template = await prisma.recurringExpense.create({
        data: { ...fields, startMonth, createdById: req.financeUser?._id || null },
      });
      return res.status(201).json(recurringRow(template, startMonth));
    }

    await assertOncePerMonth(data.category, date, { checkRecurring: true });
    const expense = await prisma.expense.create({
      data: { ...data, voucherNumber: await nextVoucherNumber("expense", "EXP"), createdById: req.financeUser?._id || null },
    });
    res.status(201).json(serializeExpense(expense));
  } catch (err) {
    next(err);
  }
};

// PUT /api/expenses/:id  { ..., recurring? }
// recurring: true turns this entry into a monthly one starting at its month.
const updateExpense = async (req, res, next) => {
  try {
    const data = parseFields(req.body, { partial: true });
    const current = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ message: "Diiwaanka lama helin." });

    const category = data.category ?? current.category;
    const date = data.expenseDate ?? current.expenseDate;
    await assertOncePerMonth(category, date, { excludeId: current.id, checkRecurring: false });

    if (isTrue(req.body.recurring)) {
      const startMonth = monthKey(date);
      await assertNoRecurringClash(category, startMonth);
      const template = await prisma.$transaction(async (tx) => {
        const created = await tx.recurringExpense.create({
          data: {
            category,
            description: data.description ?? current.description,
            amount: data.amount ?? current.amount,
            paymentMethod: data.paymentMethod ?? current.paymentMethod,
            notes: data.notes !== undefined ? data.notes : current.notes,
            startMonth,
            createdById: req.financeUser?._id || null,
          },
        });
        await tx.expense.delete({ where: { id: current.id } });
        return created;
      });
      return res.json(recurringRow(template, startMonth));
    }

    const expense = await prisma.expense.update({ where: { id: req.params.id }, data });
    res.json(serializeExpense(expense));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: "La tirtiray." });
  } catch (err) {
    next(err);
  }
};

// PUT /api/expenses/recurring/:id  { month, ...fields }
// Changes a monthly entry FROM `month` ON. Earlier months keep what they had: the old
// row ends the month before and a new one starts at `month`.
const updateRecurring = async (req, res, next) => {
  try {
    const month = requireMonth(req.body.month);
    const template = await prisma.recurringExpense.findUnique({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ message: "Diiwaanka lama helin." });
    if (month < template.startMonth || (template.endMonth && month > template.endMonth)) {
      throw badRequest("Bisha ma dhaxayso kharashkan bil kasta ah.");
    }

    const fields = parseFields(req.body, { partial: true });
    delete fields.expenseDate;
    const next_ = {
      category: fields.category ?? template.category,
      description: fields.description ?? template.description,
      amount: fields.amount ?? template.amount,
      paymentMethod: fields.paymentMethod ?? template.paymentMethod,
      notes: fields.notes !== undefined ? fields.notes : template.notes,
    };
    if (next_.category.toLowerCase() !== template.category.toLowerCase()) {
      await assertNoRecurringClash(next_.category, month, template.id);
    }

    let result;
    if (template.startMonth === month) {
      result = await prisma.recurringExpense.update({ where: { id: template.id }, data: next_ });
    } else {
      result = await prisma.$transaction(async (tx) => {
        await tx.recurringExpense.update({ where: { id: template.id }, data: { endMonth: shiftMonth(month, -1) } });
        return tx.recurringExpense.create({
          data: { ...next_, startMonth: month, endMonth: template.endMonth, createdById: req.financeUser?._id || null },
        });
      });
    }
    res.json(recurringRow(result, month));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/expenses/recurring/:id?month=YYYY-MM
// Stops a monthly entry from `month` on (earlier months are untouched).
const stopRecurring = async (req, res, next) => {
  try {
    const month = requireMonth(req.query.month);
    const template = await prisma.recurringExpense.findUnique({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ message: "Diiwaanka lama helin." });
    if (template.endMonth && month > template.endMonth) throw badRequest("Bisha ma dhaxayso kharashkan bil kasta ah.");

    if (template.startMonth >= month) await prisma.recurringExpense.delete({ where: { id: template.id } });
    else await prisma.recurringExpense.update({ where: { id: template.id }, data: { endMonth: shiftMonth(month, -1) } });
    res.json({ message: "La tirtiray." });
  } catch (err) {
    next(err);
  }
};

// POST /api/expenses/recurring/from-month  { month }
// One click: make every regular (non-"Kale") entry of this month a monthly entry that
// continues from this month on. Entries whose category is already monthly are skipped.
const repeatMonth = async (req, res, next) => {
  try {
    const month = requireMonth(req.body.month);
    const rows = await prisma.expense.findMany({
      where: { expenseDate: { gte: monthStart(month), lt: monthStart(shiftMonth(month, 1)) } },
    });

    let created = 0;
    let skipped = 0;
    for (const e of rows) {
      if (isRepeatable(e.category)) {
        skipped += 1;
        continue;
      }
      const clash = await prisma.recurringExpense.findFirst({
        where: { category: { equals: e.category, mode: "insensitive" }, OR: [{ endMonth: null }, { endMonth: { gte: month } }] },
      });
      if (clash) {
        skipped += 1;
        continue;
      }
      await prisma.$transaction(async (tx) => {
        await tx.recurringExpense.create({
          data: {
            category: e.category,
            description: e.description,
            amount: e.amount,
            paymentMethod: e.paymentMethod,
            notes: e.notes,
            startMonth: month,
            createdById: req.financeUser?._id || null,
          },
        });
        await tx.expense.delete({ where: { id: e.id } });
      });
      created += 1;
    }
    res.json({ created, skipped });
  } catch (err) {
    next(err);
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense, updateRecurring, stopRecurring, repeatMonth };
