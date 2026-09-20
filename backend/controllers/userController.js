const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { serializeUser } = require("../utils/serialize");
const { listLocked, reset } = require("../utils/loginLimiter");

// GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    res.json(users.map(serializeUser));
  } catch (err) {
    next(err);
  }
};

// POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { fullName, username, email, password, role } = req.body;
    if (!fullName || !username || !password) {
      return res.status(400).json({ message: "fullName, username, password waa waajib." });
    }
    const existing = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (existing) return res.status(400).json({ message: "Username-kan horey ayaa loo isticmaalay." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { fullName, username: username.toLowerCase(), email, password: hashed, role: role || "staff" },
    });
    res.status(201).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { fullName, email, role, status, password } = req.body;
    const data = { fullName, email, role, status };
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(serializeUser(user));
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Isticmaalaha lama helin." });
    next(err);
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: "Isticmaalaha lama helin." });
    if (user.username === "admin") {
      return res.status(403).json({ message: "System Administrator-ka guud lama tirtiri karo bogga (front-end)-ka. Haddii loo baahdo, waa in database-ka toos looga tirtiraa." });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "Isticmaalaha waa la tirtiray." });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Isticmaalaha lama helin." });
    next(err);
  }
};

// GET /api/users/locked  — logins currently blocked by the wrong-password lock
const getLockedAccounts = async (req, res, next) => {
  try {
    const rows = await Promise.all(
      listLocked().map(async (l) => {
        let name = null;
        if (l.scope === "staff") {
          name = (await prisma.user.findUnique({ where: { username: l.identifier } }))?.fullName;
        } else if (l.scope === "parent") {
          name = (await prisma.parent.findFirst({ where: { phone: l.identifier } }))?.fullName;
        } else if (l.scope === "verify") {
          name = (await prisma.user.findUnique({ where: { id: l.identifier } }))?.fullName;
        }
        return { ...l, name: name || null };
      })
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/users/unlock  { scope, identifier }
const unlockAccount = async (req, res, next) => {
  try {
    const { scope, identifier } = req.body;
    if (!["staff", "parent", "verify"].includes(scope) || !identifier) {
      return res.status(400).json({ message: "scope iyo identifier waa waajib." });
    }
    reset(scope, identifier);
    res.json({ message: "Xanibaadda waa laga qaaday." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, getLockedAccounts, unlockAccount };
