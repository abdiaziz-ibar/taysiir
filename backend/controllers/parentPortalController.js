const prisma = require("../lib/prisma");
const generateOtp = require("../utils/otp");
const { sendOtpEmail } = require("../utils/email");
const { generateParentToken } = require("../utils/generateToken");
const { serializeParent, serializeFee } = require("../utils/serialize");

const OTP_TTL_MINUTES = 10;

// POST /api/parent-portal/register  { phone, email }
// Links a portal login (email) to the Parent record the school admin
// already created, matched by phone number. Then sends the first OTP.
const register = async (req, res, next) => {
  try {
    const { phone, email } = req.body;
    if (!phone || !email) {
      return res.status(400).json({ message: "Phone iyo email waa waajib." });
    }

    const parent = await prisma.parent.findFirst({ where: { phone } });
    if (!parent) {
      return res.status(404).json({ message: "Lambarkan lagama helin waalid diiwaan gashan. La xiriir maamulka dugsiga." });
    }
    if (parent.email && parent.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ message: "Waalidkan horey ayuu email kale ugu diiwaan gashanaa. Isticmaal 'Soo Gal' haddii aad horey u is-diiwaan gelisay." });
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await prisma.parent.update({
      where: { id: parent.id },
      data: { email, otpCode, otpExpiresAt },
    });

    await sendOtpEmail(email, otpCode);
    res.json({ message: "OTP waa loo diray email-kaaga." });
  } catch (err) {
    next(err);
  }
};

// POST /api/parent-portal/request-otp  { email }
const requestOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email waa waajib." });

    const parent = await prisma.parent.findUnique({ where: { email } });
    if (!parent) {
      return res.status(404).json({ message: "Xisaabtan lama helin. Fadlan marka hore is-diiwaan geli." });
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await prisma.parent.update({ where: { id: parent.id }, data: { otpCode, otpExpiresAt } });

    await sendOtpEmail(email, otpCode);
    res.json({ message: "OTP waa loo diray email-kaaga." });
  } catch (err) {
    next(err);
  }
};

// POST /api/parent-portal/verify-otp  { email, otp }
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email iyo OTP waa waajib." });

    const parent = await prisma.parent.findUnique({ where: { email } });
    if (!parent || !parent.otpCode || !parent.otpExpiresAt) {
      return res.status(400).json({ message: "OTP khalad ah. Codso mid cusub." });
    }
    if (parent.otpCode !== otp || parent.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP khalad ah ama wakhtigiisu dhacay." });
    }

    await prisma.parent.update({ where: { id: parent.id }, data: { otpCode: null, otpExpiresAt: null } });

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

module.exports = { register, requestOtp, verifyOtp, getMe };
