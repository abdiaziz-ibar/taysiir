const express = require("express");
const router = express.Router();
const { register, login, changePassword, getMe } = require("../controllers/parentPortalController");
const { createProof, getMyProofs, getMyProofById, addMyProofMessage } = require("../controllers/paymentProofController");
const { protectParent } = require("../middleware/parentAuth");
const uploadScreenshot = require("../middleware/upload");

router.post("/register", register);
router.post("/login", login);
router.post("/change-password", protectParent, changePassword);
router.get("/me", protectParent, getMe);

router.post("/payment-proofs", protectParent, uploadScreenshot, createProof);
router.get("/payment-proofs", protectParent, getMyProofs);
router.get("/payment-proofs/:id", protectParent, getMyProofById);
router.post("/payment-proofs/:id/messages", protectParent, addMyProofMessage);

module.exports = router;
