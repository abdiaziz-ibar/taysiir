const prisma = require("../lib/prisma");
const { serializePaymentProof, serializePaymentProofMessage } = require("../utils/serialize");

const proofInclude = { parent: true, payment: true };
const proofWithMessages = { ...proofInclude, messages: { orderBy: { createdAt: "asc" } } };

// ---- Parent-facing (protectParent) ----

// POST /api/parent-portal/payment-proofs  (multipart: type, screenshot?, message, amount?, paymentId?)
// A parent either (a) submitting an invoice/screenshot as proof they paid,
// or (b) filing a complaint about a payment — same thread/status mechanics
// either way, so it's one model with a "type" flag rather than two.
const createProof = async (req, res, next) => {
  try {
    const { type, message, amount, paymentId } = req.body;
    if (!["invoice", "complaint"].includes(type)) {
      return res.status(400).json({ message: "Fadlan dooro nooca (Invoice ama Cabasho)." });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Fadlan sharax dhibaatada/lacag-bixinta." });
    }

    let validPaymentId = null;
    if (paymentId) {
      const payment = await prisma.payment.findFirst({ where: { id: paymentId, parentId: req.parentId } });
      if (payment) validPaymentId = payment.id;
    }

    const screenshotUrl = req.file ? `/uploads/payment-proofs/${req.file.filename}` : null;

    const proof = await prisma.paymentProof.create({
      data: {
        parentId: req.parentId,
        paymentId: validPaymentId,
        type,
        screenshotUrl,
        amount: amount ? Number(amount) : null,
        message: message.trim(),
      },
      include: proofInclude,
    });

    res.status(201).json(serializePaymentProof(proof));
  } catch (err) {
    next(err);
  }
};

// GET /api/parent-portal/payment-proofs
const getMyProofs = async (req, res, next) => {
  try {
    const proofs = await prisma.paymentProof.findMany({
      where: { parentId: req.parentId },
      include: proofInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(proofs.map(serializePaymentProof));
  } catch (err) {
    next(err);
  }
};

// GET /api/parent-portal/payment-proofs/:id
const getMyProofById = async (req, res, next) => {
  try {
    const proof = await prisma.paymentProof.findFirst({
      where: { id: req.params.id, parentId: req.parentId },
      include: proofWithMessages,
    });
    if (!proof) return res.status(404).json({ message: "Lama helin." });
    res.json(serializePaymentProof(proof));
  } catch (err) {
    next(err);
  }
};

// POST /api/parent-portal/payment-proofs/:id/messages  { message }
const addMyProofMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Fadlan geli fariinta." });
    }

    const proof = await prisma.paymentProof.findFirst({
      where: { id: req.params.id, parentId: req.parentId },
      include: { parent: true },
    });
    if (!proof) return res.status(404).json({ message: "Lama helin." });

    const msg = await prisma.paymentProofMessage.create({
      data: { proofId: proof.id, senderType: "parent", senderName: proof.parent.fullName, message: message.trim() },
    });

    if (proof.status === "confirmed") {
      await prisma.paymentProof.update({ where: { id: proof.id }, data: { status: "pending" } });
    }

    res.status(201).json(serializePaymentProofMessage(msg));
  } catch (err) {
    next(err);
  }
};

// ---- Staff-facing (protect) ----

// GET /api/payment-proofs?status=
const getProofs = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    const proofs = await prisma.paymentProof.findMany({
      where,
      include: proofInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(proofs.map(serializePaymentProof));
  } catch (err) {
    next(err);
  }
};

// GET /api/payment-proofs/:id
const getProofById = async (req, res, next) => {
  try {
    const proof = await prisma.paymentProof.findUnique({
      where: { id: req.params.id },
      include: proofWithMessages,
    });
    if (!proof) return res.status(404).json({ message: "Lama helin." });
    res.json(serializePaymentProof(proof));
  } catch (err) {
    next(err);
  }
};

// POST /api/payment-proofs/:id/messages  { message }
const addProofMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Fadlan geli fariinta." });
    }

    const proof = await prisma.paymentProof.findUnique({ where: { id: req.params.id } });
    if (!proof) return res.status(404).json({ message: "Lama helin." });

    const msg = await prisma.paymentProofMessage.create({
      data: { proofId: proof.id, senderType: "staff", senderName: req.user.fullName, message: message.trim() },
    });

    res.status(201).json(serializePaymentProofMessage(msg));
  } catch (err) {
    next(err);
  }
};

// PUT /api/payment-proofs/:id  { status }
const updateProofStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["pending", "confirmed"].includes(status)) {
      return res.status(400).json({ message: "Status waa inuu noqdaa 'pending' ama 'confirmed'." });
    }
    const proof = await prisma.paymentProof.update({
      where: { id: req.params.id },
      data: { status },
      include: proofInclude,
    });
    res.json(serializePaymentProof(proof));
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Lama helin." });
    next(err);
  }
};

module.exports = {
  createProof,
  getMyProofs,
  getMyProofById,
  addMyProofMessage,
  getProofs,
  getProofById,
  addProofMessage,
  updateProofStatus,
};
