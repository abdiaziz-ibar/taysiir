const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/parentPortalController");
const { createTicket, getMyTickets, getMyTicketById, addMyTicketMessage } = require("../controllers/ticketController");
const { protectParent } = require("../middleware/parentAuth");
const uploadScreenshot = require("../middleware/upload");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protectParent, getMe);

router.post("/tickets", protectParent, uploadScreenshot, createTicket);
router.get("/tickets", protectParent, getMyTickets);
router.get("/tickets/:id", protectParent, getMyTicketById);
router.post("/tickets/:id/messages", protectParent, addMyTicketMessage);

module.exports = router;
