const prisma = require("../lib/prisma");
const { serializeParent } = require("../utils/serialize");

const nextParentId = async () => {
  const count = await prisma.parent.count();
  return `P${String(count + 1).padStart(3, "0")}`;
};

// GET /api/parents?search=&status=&academicYearId=&sort=
const getParents = async (req, res, next) => {
  try {
    const { search, status, academicYearId, sort } = req.query;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const parents = await prisma.parent.findMany({ where });

    const fees = await prisma.fee.findMany({
      where: academicYearId ? { academicYearId } : {},
    });
    const feeByParent = {};
    fees.forEach((f) => {
      feeByParent[f.parentId] = f;
    });

    let result = parents.map((p) => {
      const fee = feeByParent[p.id];
      return {
        ...serializeParent(p),
        totalFee: fee ? fee.totalAmount : 0,
        totalPaid: fee ? fee.totalPaid : 0,
        balance: fee ? fee.balance : 0,
        feeStatus: fee ? fee.status : "unpaid",
      };
    });

    if (status) {
      result = result.filter((p) => p.feeStatus === status);
    }

    if (sort === "balance_desc") result.sort((a, b) => b.balance - a.balance);
    else if (sort === "balance_asc") result.sort((a, b) => a.balance - b.balance);
    else if (sort === "name") result.sort((a, b) => a.fullName.localeCompare(b.fullName));
    else if (sort === "date") result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/parents/:id
const getParentById = async (req, res, next) => {
  try {
    const parent = await prisma.parent.findUnique({ where: { id: req.params.id } });
    if (!parent) return res.status(404).json({ message: "Waalidka lama helin." });

    const fees = await prisma.fee.findMany({
      where: { parentId: parent.id },
      include: { academicYear: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      ...serializeParent(parent),
      fees: fees.map((f) => {
        const { academicYear, ...rest } = f;
        const { id, ...feeRest } = rest;
        return { _id: id, ...feeRest, academicYearId: { _id: academicYear.id, name: academicYear.name } };
      }),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/parents
const createParent = async (req, res, next) => {
  try {
    const { fullName, phone, alternativePhone, address, email, notes } = req.body;
    if (!fullName || !phone) {
      return res.status(400).json({ message: "Magaca iyo Phone waa waajib." });
    }
    const parentId = await nextParentId();
    const parent = await prisma.parent.create({
      data: { parentId, fullName, phone, alternativePhone, address, email: email || null, notes },
    });
    res.status(201).json(serializeParent(parent));
  } catch (err) {
    next(err);
  }
};

// PUT /api/parents/:id
const updateParent = async (req, res, next) => {
  try {
    const { fullName, phone, alternativePhone, address, email, notes, status } = req.body;
    const parent = await prisma.parent.update({
      where: { id: req.params.id },
      data: { fullName, phone, alternativePhone, address, email: email || null, notes, status },
    });
    res.json(serializeParent(parent));
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Waalidka lama helin." });
    next(err);
  }
};

// DELETE /api/parents/:id
const deleteParent = async (req, res, next) => {
  try {
    await prisma.parent.delete({ where: { id: req.params.id } });
    res.json({ message: "Waalidka waa la tirtiray." });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Waalidka lama helin." });
    next(err);
  }
};

module.exports = { getParents, getParentById, createParent, updateParent, deleteParent };
