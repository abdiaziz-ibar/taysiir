const prisma = require("../lib/prisma");

const PRESETS = [
  "Koronto", "Biyaha", "Kiro", "Internet & Telefoon", "Agabka & Qalabka",
  "Qalin & Buugaag", "Dayactir", "Gaadiid & Shidaal", "Nadaafad", "Cunto & Casuumaad", "Kale",
];
const BUILT_IN = "Kale"; // the catch-all: can't be renamed or removed

const badRequest = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

// The first time the list is read, start it with the standard types.
const ensureSeeded = async () => {
  if ((await prisma.expenseCategory.count()) > 0) return;
  await prisma.expenseCategory.createMany({
    data: PRESETS.map((name, i) => ({ name, sortOrder: i })),
    skipDuplicates: true,
  });
};

// Names of the types that are switched off (hidden from the checklist and the pickers).
const inactiveNames = async () => {
  const rows = await prisma.expenseCategory.findMany({ where: { isActive: false }, select: { name: true } });
  return new Set(rows.map((r) => r.name.toLowerCase()));
};

const cleanName = (value) => {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (!name) throw badRequest("Fadlan qor magaca nooca.");
  if (name.length > 60) throw badRequest("Magaca nooca aad buu u dheer yahay.");
  return name;
};

const usageOf = async (name) => {
  const [expenses, recurring] = await Promise.all([
    prisma.expense.count({ where: { category: { equals: name, mode: "insensitive" } } }),
    prisma.recurringExpense.count({ where: { category: { equals: name, mode: "insensitive" } } }),
  ]);
  return expenses + recurring;
};

const withUsage = async (c) => ({ _id: c.id, name: c.name, isActive: c.isActive, builtIn: c.name === BUILT_IN, used: await usageOf(c.name) });

// GET /api/expense-categories
const getCategories = async (req, res, next) => {
  try {
    await ensureSeeded();
    const list = await prisma.expenseCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    res.json(await Promise.all(list.map(withUsage)));
  } catch (err) {
    next(err);
  }
};

// POST /api/expense-categories  { name }
const createCategory = async (req, res, next) => {
  try {
    await ensureSeeded();
    const name = cleanName(req.body.name);
    const existing = await prisma.expenseCategory.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
    if (existing) {
      if (existing.isActive) throw badRequest(`"${name}" horey ayuu u jiray liiska.`);
      return res.status(201).json(await withUsage(await prisma.expenseCategory.update({ where: { id: existing.id }, data: { isActive: true } })));
    }
    const max = await prisma.expenseCategory.aggregate({ _max: { sortOrder: true } });
    const created = await prisma.expenseCategory.create({ data: { name, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
    res.status(201).json(await withUsage(created));
  } catch (err) {
    next(err);
  }
};

// PUT /api/expense-categories/:id  { name?, isActive? }
// Renaming also renames the type on every expense (and monthly entry) that used it.
const updateCategory = async (req, res, next) => {
  try {
    const current = await prisma.expenseCategory.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ message: "Nooca lama helin." });
    if (current.name === BUILT_IN) throw badRequest(`"${BUILT_IN}" waa nooc aasaasi ah, lama beddeli karo.`);

    const data = {};
    if (req.body.isActive !== undefined) data.isActive = !!req.body.isActive;

    if (req.body.name !== undefined) {
      const name = cleanName(req.body.name);
      if (name.toLowerCase() === BUILT_IN.toLowerCase()) throw badRequest(`"${BUILT_IN}" waa nooc aasaasi ah.`);
      const clash = await prisma.expenseCategory.findFirst({ where: { name: { equals: name, mode: "insensitive" }, NOT: { id: current.id } } });
      if (clash) throw badRequest(`"${name}" horey ayuu u jiray liiska.`);
      data.name = name;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.name && data.name !== current.name) {
        await tx.expense.updateMany({ where: { category: { equals: current.name, mode: "insensitive" } }, data: { category: data.name } });
        await tx.recurringExpense.updateMany({ where: { category: { equals: current.name, mode: "insensitive" } }, data: { category: data.name } });
      }
      return tx.expenseCategory.update({ where: { id: current.id }, data });
    });
    res.json(await withUsage(updated));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/expense-categories/:id
// A type nothing was ever recorded under is removed; one with history is only hidden, so past
// months keep their entries.
const deleteCategory = async (req, res, next) => {
  try {
    const current = await prisma.expenseCategory.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ message: "Nooca lama helin." });
    if (current.name === BUILT_IN) throw badRequest(`"${BUILT_IN}" waa nooc aasaasi ah, lama tirtiri karo.`);

    if ((await usageOf(current.name)) === 0) {
      await prisma.expenseCategory.delete({ where: { id: current.id } });
      return res.json({ removed: true });
    }
    await prisma.expenseCategory.update({ where: { id: current.id }, data: { isActive: false } });
    res.json({ removed: false, hidden: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, inactiveNames };
