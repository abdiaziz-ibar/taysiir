const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { generateParentToken } = require("../utils/generateToken");
const { serializeParent, serializeFee } = require("../utils/serialize");

// POST /api/parent-portal/register  { phone, password }
// First-time password setup for the Parent record the school admin already
// created — matched by phone, which is itself the whitelist check: a phone
// the admin never entered can never get past this.
const register = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "Phone iyo Password waa waajib." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password-ku waa inuu ahaadaa ugu yaraan 6 xaraf." });
    }

    const parent = await prisma.parent.findFirst({ where: { phone } });
    if (!parent) {
      return res.status(404).json({ message: "Lambarkan lagama helin waalid diiwaan gashan. La xiriir maamulka dugsiga." });
    }
    if (parent.password) {
      return res.status(400).json({ message: "Xisaabtan horey ayaa loo diiwaan geliyay. Isticmaal 'Soo Gal'." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const updated = await prisma.parent.update({ where: { id: parent.id }, data: { password: hashed } });

    const token = generateParentToken(updated.id);
    res.json({ token, parent: serializeParent(updated) });
  } catch (err) {
    next(err);
  }
};

// POST /api/parent-portal/login  { phone, password }
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: "Phone iyo Password waa waajib." });
    }

    const parent = await prisma.parent.findFirst({ where: { phone } });
    if (!parent || !parent.password) {
      return res.status(404).json({ message: "Xisaabtan lama helin. Fadlan marka hore dhig password-kaaga." });
    }

    const isMatch = await bcrypt.compare(password, parent.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Phone ama Password khalad ah." });
    }

    const token = generateParentToken(parent.id);
    res.json({ token, parent: serializeParent(parent) });
  } catch (err) {
    next(err);
  }
};

// GET /api/parent-portal/me  (protectParent) — only ever reads req.parentId,
// never a client-supplied id, so a parent can only ever see their own data.
const getMe = async (req, res, next) => {
  try {
    const parent = await prisma.parent.findUnique({ where: { id: req.parentId } });
    if (!parent) return res.status(404).json({ message: "Waalidka lama helin." });

    const fees = await prisma.fee.findMany({
      where: { parentId: parent.id },
      include: { academicYear: true },
      orderBy: { createdAt: "desc" },
    });
    const payments = await prisma.payment.findMany({
      where: { parentId: parent.id },
      include: { academicYear: true },
      orderBy: { paymentDate: "desc" },
    });

    res.json({
      parent: serializeParent(parent),
      fees: fees.map(serializeFee),
      payments: payments.map((p) => {
        const { academicYear, ...rest } = p;
        const { id, ...paymentRest } = rest;
        return { _id: id, ...paymentRest, academicYearId: { _id: academicYear.id, name: academicYear.name } };
      }),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
