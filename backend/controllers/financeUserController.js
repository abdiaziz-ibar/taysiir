const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { serializeUser } = require("../utils/serialize");

const badRequest = (message) => Object.assign(new Error(message), { statusCode: 400 });

// Admin-side management of the finance section's login accounts. The admin
// can create / disable / reset these, but cannot see finance data with them.

// GET /api/finance-users
const getFinanceUsers = async (req, res, next) => {
  try {
    const users = await prisma.financeUser.findMany({ orderBy: { createdAt: "desc" } });
    res.json(users.map(serializeUser));
  } catch (err) {
    next(err);
  }
};

// POST /api/finance-users  { fullName, username, password }
const createFinanceUser = async (req, res, next) => {
  try {
    const { fullName, username, password } = req.body;
    if (!fullName?.trim() || !username?.trim() || !password) {
      throw badRequest("Magaca, username iyo password waa waajib.");
    }
    if (password.length < 6) throw badRequest("Password-ku waa inuu ahaadaa ugu yaraan 6 xaraf.");

    const key = username.trim().toLowerCase();
    if (await prisma.financeUser.findUnique({ where: { username: key } })) {
      throw badRequest("Username-kan horey ayaa loo isticmaalay.");
    }
    const user = await prisma.financeUser.create({
      data: { fullName: fullName.trim(), username: key, password: await bcrypt.hash(password, 10) },
    });
    res.status(201).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
};

// PUT /api/finance-users/:id  { fullName?, status?, password? }
const updateFinanceUser = async (req, res, next) => {
  try {
    const { fullName, status, password } = req.body;
    const data = {};
    if (fullName !== undefined) {
      if (!fullName.trim()) throw badRequest("Magaca waa waajib.");
      data.fullName = fullName.trim();
    }
    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) throw badRequest("Xaaladda khalad ah.");
      data.status = status;
    }
    if (password) {
      if (password.length < 6) throw badRequest("Password-ku waa inuu ahaadaa ugu yaraan 6 xaraf.");
      data.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.financeUser.update({ where: { id: req.params.id }, data });
    res.json(serializeUser(user));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/finance-users/:id  (their past entries stay, with no creator)
const deleteFinanceUser = async (req, res, next) => {
  try {
    await prisma.financeUser.delete({ where: { id: req.params.id } });
    res.json({ message: "Isticmaalaha waa la tirtiray." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFinanceUsers, createFinanceUser, updateFinanceUser, deleteFinanceUser };
