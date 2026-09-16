const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const generateToken = require("../utils/generateToken");
const { serializeUser } = require("../utils/serialize");

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Fadlan geli username iyo password." });
    }
    const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Username ama password khalad ah." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Username ama password khalad ah." });
    }
    const token = generateToken(user.id);
    res.json({ token, user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// POST /api/auth/verify-password  { password }
// Re-checks the CURRENTLY logged-in admin's own password, as a step-up
// confirmation before an irreversible action (e.g. deleting a parent).
const verifyPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Fadlan geli password-ka." });

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Kaliya admin ayaa tallaabadan sameyn kara." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user._id } });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password-ku waa khalad." });
    }
    res.json({ valid: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, verifyPassword };
