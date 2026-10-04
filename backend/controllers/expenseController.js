const prisma = require("../lib/prisma");
const nextVoucherNumber = require("../utils/voucherNumber");
const { serializeExpense } = require("../utils/serialize");

const METHODS = ["Cash", "Mobile Money", "Bank", "Other"];
const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

const badRequest = (message) => Object.assign(new Error(message), { statusCode: 400 });

// "Kale" is the catch-all bucket for miscellaneous items, so it can repeat; every other category is a
// regular bill/cost and is recorded once per month (to change it, edit the existing entry).
const REPEATABLE_CATEGORIES = ["Kale"];

// A description must be actual text: at least 3 characters with at least one
// letter — a bare number like "2222" is rejected.
const validateDescription = (text) => {
  if (text.length < 3) throw badRequest("Sharaxaadda aad bay u gaaban tahay (ugu yaraan 3 xaraf).");
  if (!/\p{L}/u.test(text)) throw badRequest("Sharaxaadda waa inay noqotaa qoraal (ereyo), ma aha lambar kaliya.");
};

const assertOncePerMonth = async (category, date, excludeId) => {
  if (REPEATABLE_CATEGORIES.includes(category)) return;
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
    const label = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    throw badRequest(
      `"${category}" bisha ${label} horey ayaa loo diiwaan geliyay (${existing.voucherNumber}, $${existing.amount}). Fadlan Edit ka samee kii hore, ama dooro bil kale.`
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

// GET /api/expenses?month=YYYY-MM&category=&search=
// No month = every expense. Returns the rows plus the total and a
// per-category breakdown for the same filter.
const getExpenses = async (req, res, next) => {
  try {
    const { month, category, search } = req.query;
    const where = {};

    if (month) {
      const m = MONTH_RE.exec(month);
      if (!m) throw badRequest("Bisha waa inay noqotaa qaabka YYYY-MM.");
      const y = Number(m[1]);
      const mi = Number(m[2]) - 1;
      where.expenseDate = { gte: new Date(y, mi, 1), lt: new Date(y, mi + 1, 1) };
    }
    if (category) where.category = category;
    if (search) where.description = { contains: search, mode: "insensitive" };

    const expenses = await prisma.expense.findMany({ where, orderBy: { expenseDate: "desc" } });

    const byCat = {};
    expenses.forEach((e) => {
      byCat[e.category] = byCat[e.category] || { category: e.category, total: 0, count: 0 };
      byCat[e.category].total += e.amount;
      byCat[e.category].count += 1;
    });

    res.json({
      expenses: expenses.map(serializeExpense),
      total: expenses.reduce((s, e) => s + e.amount, 0),
      byCategory: Object.values(byCat).sort((a, b) => b.total - a.total),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    const data = parseFields(req.body, { partial: false });
    await assertOncePerMonth(data.category, data.expenseDate || new Date());
    const expense = await prisma.expense.create({
      data: {
        ...data,
        voucherNumber: await nextVoucherNumber("expense", "EXP"),
        createdById: req.financeUser?._id || null,
      },
    });
    res.status(201).json(serializeExpense(expense));
  } catch (err) {
    next(err);
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    const data = parseFields(req.body, { partial: true });
    const current = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ message: "Diiwaanka lama helin." });
    await assertOncePerMonth(data.category ?? current.category, data.expenseDate ?? current.expenseDate, current.id);
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

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
