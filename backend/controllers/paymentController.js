const prisma = require("../lib/prisma");
const generateReceiptNumber = require("../utils/receiptNumber");
const { serializePayment, serializeFee } = require("../utils/serialize");

const recalculate = (totalAmount, totalPaid) => {
  const balance = Math.max(totalAmount - totalPaid, 0);
  let status;
  if (totalPaid <= 0) status = "unpaid";
  else if (balance <= 0) status = "paid";
  else status = "partial";
  return { balance, status };
};

const paymentInclude = {
  parent: true,
  academicYear: true,
  fee: true,
  createdBy: true,
};

// GET /api/payments?parentId=&academicYearId=
const getPayments = async (req, res, next) => {
  try {
    const { parentId, academicYearId } = req.query;
    const where = {};
    if (parentId) where.parentId = parentId;
    if (academicYearId) where.academicYearId = academicYearId;

    const payments = await prisma.payment.findMany({
      where,
      include: { parent: true, academicYear: true },
      orderBy: { paymentDate: "desc" },
    });
    res.json(payments.map(serializePayment));
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/:id
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: paymentInclude,
    });
    if (!payment) return res.status(404).json({ message: "Lacag-bixintan lama helin." });
    res.json(serializePayment(payment));
  } catch (err) {
    next(err);
  }
};

// POST /api/payments
// { parentId, academicYearId, feeId, amount, paymentDate, paymentMethod, referenceNumber, notes, allowOverpayment }
const createPayment = async (req, res, next) => {
  try {
    const {
      parentId,
      academicYearId,
      feeId,
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
      allowOverpayment,
    } = req.body;

    if (!parentId || !academicYearId || !feeId || !amount || !paymentMethod) {
      return res.status(400).json({ message: "Fadlan buuxi dhammaan xogta lagama maarmaanka ah." });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ message: "Lacagta waa inay ka weyn tahay 0." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const fee = await tx.fee.findUnique({ where: { id: feeId } });
      if (!fee) {
        const err = new Error("Fee-ga lama helin.");
        err.statusCode = 404;
        throw err;
      }
      if (!allowOverpayment && Number(amount) > fee.balance) {
        const err = new Error(
          `Lacagta la geliyay ($${amount}) way ka badan tahay Ku Dhiman-ka ($${fee.balance}).`
        );
        err.statusCode = 400;
        throw err;
      }

      const receiptNumber = await generateReceiptNumber();

      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          parentId,
          academicYearId,
          feeId,
          amount: Number(amount),
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod,
          referenceNumber,
          notes,
          createdById: req.user?._id || null,
        },
        include: { parent: true, academicYear: true },
      });

      const newTotalPaid = fee.totalPaid + Number(amount);
      const { balance, status } = recalculate(fee.totalAmount, newTotalPaid);
      const updatedFee = await tx.fee.update({
        where: { id: fee.id },
        data: { totalPaid: newTotalPaid, balance, status },
      });

      return { payment, fee: updatedFee };
    });

    res.status(201).json({
      payment: serializePayment(result.payment),
      fee: serializeFee(result.fee),
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/payments/:id
// { amount, paymentDate, paymentMethod, referenceNumber, notes, allowOverpayment }
const updatePayment = async (req, res, next) => {
  try {
    const { amount, paymentDate, paymentMethod, referenceNumber, notes, allowOverpayment } = req.body;

    if (amount !== undefined && Number(amount) <= 0) {
      return res.status(400).json({ message: "Lacagta waa inay ka weyn tahay 0." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: req.params.id } });
      if (!payment) {
        const err = new Error("Lacag-bixintan lama helin.");
        err.statusCode = 404;
        throw err;
      }
      const fee = await tx.fee.findUnique({ where: { id: payment.feeId } });
      if (!fee) {
        const err = new Error("Fee-ga lama helin.");
        err.statusCode = 404;
        throw err;
      }

      const newAmount = amount !== undefined ? Number(amount) : payment.amount;
      const totalPaidWithoutThis = fee.totalPaid - payment.amount;
      const newTotalPaid = totalPaidWithoutThis + newAmount;

      if (!allowOverpayment && newTotalPaid > fee.totalAmount) {
        const err = new Error(
          `Lacagta la geliyay ($${newAmount}) way ka badan tahay Ku Dhiman-ka ($${fee.totalAmount - totalPaidWithoutThis}).`
        );
        err.statusCode = 400;
        throw err;
      }

      const { balance, status } = recalculate(fee.totalAmount, newTotalPaid);
      const updatedFee = await tx.fee.update({
        where: { id: fee.id },
        data: { totalPaid: newTotalPaid, balance, status },
      });

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          amount: newAmount,
          paymentDate: paymentDate ? new Date(paymentDate) : payment.paymentDate,
          paymentMethod: paymentMethod ?? payment.paymentMethod,
          referenceNumber: referenceNumber ?? payment.referenceNumber,
          notes: notes ?? payment.notes,
        },
        include: paymentInclude,
      });

      return { payment: updatedPayment, fee: updatedFee };
    });

    res.json({
      payment: serializePayment(result.payment),
      fee: serializeFee(result.fee),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/payments/:id  (reverses the payment from the fee balance)
const deletePayment = async (req, res, next) => {
  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: req.params.id } });
      if (!payment) {
        const err = new Error("Lacag-bixintan lama helin.");
        err.statusCode = 404;
        throw err;
      }
      const fee = await tx.fee.findUnique({ where: { id: payment.feeId } });
      if (fee) {
        const newTotalPaid = Math.max(fee.totalPaid - payment.amount, 0);
        const { balance, status } = recalculate(fee.totalAmount, newTotalPaid);
        await tx.fee.update({
          where: { id: fee.id },
          data: { totalPaid: newTotalPaid, balance, status },
        });
      }
      await tx.payment.delete({ where: { id: payment.id } });
    });

    res.json({ message: "Lacag-bixintii waa la tirtiray oo Balance-ka waa la cusboonaysiiyay." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPayments, getPaymentById, createPayment, updatePayment, deletePayment };
