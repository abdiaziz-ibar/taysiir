const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { generateFinanceToken } = require("../utils/generateToken");
const { serializeUser } = require("../utils/serialize");
const { getLockRemaining, failureResult, reset, lockedMessage } = require("../utils/loginLimiter");

// POST /api/finance-auth/login  { username, password }
// Same 3-strike / 10-minute lock as the other logins (scope "finance").
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Fadlan geli username iyo password." });
    }
    const key = username.toLowerCase();
    const lockedFor = getLockRemaining("finance", key);
    if (lockedFor > 0) return res.status(429).json({ message: lockedMessage(lockedFor) });

    const user = await prisma.financeUser.findUnique({ where: { username: key } });
    const isMatch = user && user.status === "active" && (await bcrypt.compare(password, user.password));
    if (!isMatch) {
      const { status, message } = failureResult("finance", key, "Username ama password khalad ah.");
      return res.status(status).json({ message });
    }
    reset("finance", key);
    res.json({ token: generateFinanceToken(user.id), user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
};

// GET /api/finance-auth/me
const getMe = (req, res) => {
  const { _id, ...rest } = req.financeUser;
  res.json({ user: { _id, ...rest } });
};

// POST /api/finance-auth/verify-password  { password }
// Step-up confirmation before an irreversible action (a delete).
const verifyPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Fadlan geli password-ka." });

    const lockedFor = getLockRemaining("verify", req.financeUser._id);
    if (lockedFor > 0) return res.status(429).json({ message: lockedMessage(lockedFor) });

    const user = await prisma.financeUser.findUnique({ where: { id: req.financeUser._id } });
    if (!(await bcrypt.compare(password, user.password))) {
      const { status, message } = failureResult("verify", req.financeUser._id, "Password-ku waa khalad.");
      return res.status(status).json({ message });
    }
    reset("verify", req.financeUser._id);
    res.json({ valid: true });
  } catch (err) {
    next(err);
  }
};

// POST /api/finance-auth/change-password  { currentPassword, newPassword }
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Password-ka hadda iyo kan cusub waa waajib." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password-ku waa inuu ahaadaa ugu yaraan 6 xaraf." });
    }

    const lockedFor = getLockRemaining("finance", req.financeUser.username);
    if (lockedFor > 0) return res.status(429).json({ message: lockedMessage(lockedFor) });

    const user = await prisma.financeUser.findUnique({ where: { id: req.financeUser._id } });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      const { status, message } = failureResult("finance", req.financeUser.username, "Password-ka hadda jira waa khalad.");
      return res.status(status).json({ message });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "Password-ka cusub waa inuu ka duwanaadaa kan hadda jira." });
    }

    await prisma.financeUser.update({ where: { id: user.id }, data: { password: await bcrypt.hash(newPassword, 10) } });
    reset("finance", req.financeUser.username);
    res.json({ message: "Password-ka waa la beddelay." });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, verifyPassword, changePassword };
