const express = require("express");
const router = express.Router();
const { getProofs, getProofById, addProofMessage, updateProofStatus } = require("../controllers/paymentProofController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getProofs);
router.get("/:id", getProofById);
router.post("/:id/messages", addProofMessage);
router.put("/:id", updateProofStatus);

module.exports = router;
