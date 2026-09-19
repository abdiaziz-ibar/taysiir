const prisma = require("../lib/prisma");
const { serializeTicket, serializeTicketMessage } = require("../utils/serialize");

const ticketInclude = { parent: true, payment: true };
const ticketWithMessages = { ...ticketInclude, messages: { orderBy: { createdAt: "asc" } } };

// ---- Parent-facing (protectParent) ----

// POST /api/parent-portal/tickets  (multipart: screenshot, message, paymentId?)
const createTicket = async (req, res, next) => {
  try {
    const { message, paymentId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Fadlan sharax dhibaatada." });
    }

    let validPaymentId = null;
    if (paymentId) {
      const payment = await prisma.payment.findFirst({ where: { id: paymentId, parentId: req.parentId } });
      if (payment) validPaymentId = payment.id;
    }

    const screenshotUrl = req.file ? `/uploads/tickets/${req.file.filename}` : null;

    const ticket = await prisma.paymentTicket.create({
      data: {
        parentId: req.parentId,
        paymentId: validPaymentId,
        screenshotUrl,
        message: message.trim(),
      },
      include: ticketInclude,
    });

    res.status(201).json(serializeTicket(ticket));
  } catch (err) {
    next(err);
  }
};

// GET /api/parent-portal/tickets
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await prisma.paymentTicket.findMany({
      where: { parentId: req.parentId },
      include: ticketInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(tickets.map(serializeTicket));
  } catch (err) {
    next(err);
  }
};

// GET /api/parent-portal/tickets/:id
const getMyTicketById = async (req, res, next) => {
  try {
    const ticket = await prisma.paymentTicket.findFirst({
      where: { id: req.params.id, parentId: req.parentId },
      include: ticketWithMessages,
    });
    if (!ticket) return res.status(404).json({ message: "Dhibaatadan lama helin." });
    res.json(serializeTicket(ticket));
  } catch (err) {
    next(err);
  }
};

// POST /api/parent-portal/tickets/:id/messages  { message }
const addMyTicketMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Fadlan geli fariinta." });
    }

    const ticket = await prisma.paymentTicket.findFirst({
      where: { id: req.params.id, parentId: req.parentId },
      include: { parent: true },
    });
    if (!ticket) return res.status(404).json({ message: "Dhibaatadan lama helin." });

    const msg = await prisma.ticketMessage.create({
      data: { ticketId: ticket.id, senderType: "parent", senderName: ticket.parent.fullName, message: message.trim() },
    });

    if (ticket.status === "resolved") {
      await prisma.paymentTicket.update({ where: { id: ticket.id }, data: { status: "open" } });
    }

    res.status(201).json(serializeTicketMessage(msg));
  } catch (err) {
    next(err);
  }
};

// ---- Staff-facing (protect) ----

// GET /api/tickets?status=
const getTickets = async (req, res, next) => {
  try {
    const { status } = req.query;
    const tickets = await prisma.paymentTicket.findMany({
      where: status ? { status } : {},
      include: ticketInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(tickets.map(serializeTicket));
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets/:id
const getTicketById = async (req, res, next) => {
  try {
    const ticket = await prisma.paymentTicket.findUnique({
      where: { id: req.params.id },
      include: ticketWithMessages,
    });
    if (!ticket) return res.status(404).json({ message: "Dhibaatadan lama helin." });
    res.json(serializeTicket(ticket));
  } catch (err) {
    next(err);
  }
};

// POST /api/tickets/:id/messages  { message }
const addTicketMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Fadlan geli fariinta." });
    }

    const ticket = await prisma.paymentTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) return res.status(404).json({ message: "Dhibaatadan lama helin." });

    const msg = await prisma.ticketMessage.create({
      data: { ticketId: ticket.id, senderType: "staff", senderName: req.user.fullName, message: message.trim() },
    });

    res.status(201).json(serializeTicketMessage(msg));
  } catch (err) {
    next(err);
  }
};

// PUT /api/tickets/:id  { status }
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["open", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Status waa inuu noqdaa 'open' ama 'resolved'." });
    }
    const ticket = await prisma.paymentTicket.update({
      where: { id: req.params.id },
      data: { status },
      include: ticketInclude,
    });
    res.json(serializeTicket(ticket));
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Dhibaatadan lama helin." });
    next(err);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getMyTicketById,
  addMyTicketMessage,
  getTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
};
