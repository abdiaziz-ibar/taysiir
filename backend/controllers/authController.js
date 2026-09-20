const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const generateToken = require("../utils/generateToken");
const { serializeUser } = require("../utils/serialize");
const { getLockRemaining, failureResult, reset, lockedMessage } = require("../utils/loginLimiter");

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Fadlan geli username iyo password." });
    }
    const lockedFor = getLockRemaining("staff", username);
    if (lockedFor > 0) return res.status(429).json({ message: lockedMessage(lockedFor) });

    const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    const isMatch = user && user.status === "active" && (await bcrypt.compare(password, user.password));
    if (!isMatch) {
      const { status, message } = failureResult("staff", username, "Username ama password khalad ah.");
      return res.status(status).json({ message });
    }
    reset("staff", username);
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

    const lockedFor = getLockRemaining("verify", req.user._id);
    if (lockedFor > 0) return res.status(429).json({ message: lockedMessage(lockedFor) });

    const user = await prisma.user.findUnique({ where: { id: req.user._id } });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const { status, message } = failureResult("verify", req.user._id, "Password-ku waa khalad.");
      return res.status(status).json({ message });
    }
    reset("verify", req.user._id);
    res.json({ valid: true });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/change-password  { currentPassword, newPassword }
// For the logged-in user's own password. A wrong current password counts
// toward the same 3-strike lock as login.
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Password-ka hadda iyo kan cusub waa waajib." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password-ku waa inuu ahaadaa ugu yaraan 6 xaraf." });
    }

    const lockedFor = getLockRemaining("staff", req.user.username);
    if (lockedFor > 0) return res.status(429).json({ message: lockedMessage(lockedFor) });

    const user = await prisma.user.findUnique({ where: { id: req.user._id } });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      const { status, message } = failureResult("staff", req.user.username, "Password-ka hadda jira waa khalad.");
      return res.status(status).json({ message });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "Password-ka cusub waa inuu ka duwanaadaa kan hadda jira." });
    }

    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(newPassword, 10) } });
    reset("staff", req.user.username);
    res.json({ message: "Password-ka waa la beddelay." });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, verifyPassword, changePassword };
