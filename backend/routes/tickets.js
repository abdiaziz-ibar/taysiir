const express = require("express");
const router = express.Router();
const { getTickets, getTicketById, addTicketMessage, updateTicketStatus } = require("../controllers/ticketController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getTickets);
router.get("/:id", getTicketById);
router.post("/:id/messages", addTicketMessage);
router.put("/:id", updateTicketStatus);

module.exports = router;
