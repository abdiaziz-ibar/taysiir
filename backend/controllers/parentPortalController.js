const prisma = require("../lib/prisma");
const generateOtp = require("../utils/otp");
const { sendOtpWhatsapp } = require("../utils/whatsapp");
const { generateParentToken } = require("../utils/generateToken");
const { serializeParent, serializeFee } = require("../utils/serialize");

const OTP_TTL_MINUTES = 10;

// POST /api/parent-portal/register  { phone }
// Confirms the phone number matches a Parent record the school admin
// already created, then sends the first OTP over WhatsApp.
const register = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone waa waajib." });
    }

    const parent = await prisma.parent.findFirst({ where: { phone } });
    if (!parent) {
      return res.status(404).json({ message: "Lambarkan lagama helin waalid diiwaan gashan. La xiriir maamulka dugsiga." });
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await prisma.parent.update({ where: { id: parent.id }, data: { otpCode, otpExpiresAt } });

    await sendOtpWhatsapp(phone, otpCode);
    res.json({ message: "OTP waa loogu diray WhatsApp-kaaga." });
  } catch (err) {
    next(err);
  }
};

// POST /api/parent-portal/request-otp  { phone }
const requestOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone waa waajib." });

    const parent = await prisma.parent.findFirst({ where: { phone } });
    if (!parent) {
      return res.status(404).json({ message: "Xisaabtan lama helin. Fadlan marka hore is-diiwaan geli." });
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await prisma.parent.update({ where: { id: parent.id }, data: { otpCode, otpExpiresAt } });

    await sendOtpWhatsapp(phone, otpCode);
    res.json({ message: "OTP waa loogu diray WhatsApp-kaaga." });
  } catch (err) {
    next(err);
  }
};

// POST /api/parent-portal/verify-otp  { phone, otp }
const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone iyo OTP waa waajib." });

    const parent = await prisma.parent.findFirst({ where: { phone } });
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
