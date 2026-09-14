const prisma = require("../lib/prisma");
const { serializeFee } = require("../utils/serialize");

const recalculate = (totalAmount, totalPaid) => {
  const balance = Math.max(totalAmount - totalPaid, 0);
  let status;
  if (totalPaid <= 0) status = "unpaid";
  else if (balance <= 0) status = "paid";
  else status = "partial";
  return { balance, status };
};

// GET /api/fees?parentId=&academicYearId=
const getFees = async (req, res, next) => {
  try {
    const { parentId, academicYearId } = req.query;
    const where = {};
    if (parentId) where.parentId = parentId;
    if (academicYearId) where.academicYearId = academicYearId;

    const fees = await prisma.fee.findMany({
      where,
      include: { parent: true, academicYear: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(fees.map(serializeFee));
  } catch (err) {
    next(err);
  }
};

// GET /api/fees/:id
const getFeeById = async (req, res, next) => {
  try {
    const fee = await prisma.fee.findUnique({
      where: { id: req.params.id },
      include: { parent: true, academicYear: true },
    });
    if (!fee) return res.status(404).json({ message: "Fee-ga lama helin." });
    res.json(serializeFee(fee));
  } catch (err) {
    next(err);
  }
};

// POST /api/fees  { parentId, academicYearId, totalAmount }
const createFee = async (req, res, next) => {
  try {
    const { parentId, academicYearId, totalAmount } = req.body;
    if (!parentId || !academicYearId || totalAmount === undefined) {
      return res.status(400).json({ message: "parentId, academicYearId, totalAmount waa waajib." });
    }
    const existing = await prisma.fee.findUnique({
      where: { parentId_academicYearId: { parentId, academicYearId } },
    });
    if (existing) {
      return res.status(400).json({ message: "Waalidkan Fee ayuu horey u leeyahay sanadkan dugsiyeedka ah." });
    }
    const { balance, status } = recalculate(Number(totalAmount), 0);
    const fee = await prisma.fee.create({
      data: { parentId, academicYearId, totalAmount: Number(totalAmount), totalPaid: 0, balance, status },
    });
    res.status(201).json(serializeFee(fee));
  } catch (err) {
    next(err);
  }
};

// PUT /api/fees/:id  { totalAmount, totalPaid }
const updateFee = async (req, res, next) => {
  try {
    const fee = await prisma.fee.findUnique({ where: { id: req.params.id } });
    if (!fee) return res.status(404).json({ message: "Fee-ga lama helin." });

    const totalAmount = req.body.totalAmount !== undefined ? Number(req.body.totalAmount) : fee.totalAmount;
    const totalPaid = req.body.totalPaid !== undefined ? Number(req.body.totalPaid) : fee.totalPaid;
    const { balance, status } = recalculate(totalAmount, totalPaid);

    const updated = await prisma.fee.update({
      where: { id: fee.id },
      data: { totalAmount, totalPaid, balance, status },
    });
    res.json(serializeFee(updated));
  } catch (err) {
    next(err);
  }
};

module.exports = { getFees, getFeeById, createFee, updateFee };
