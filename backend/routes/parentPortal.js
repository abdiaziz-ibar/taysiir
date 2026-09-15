const express = require("express");
const router = express.Router();
const { register, requestOtp, verifyOtp, getMe } = require("../controllers/parentPortalController");
const { protectParent } = require("../middleware/parentAuth");

router.post("/register", register);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.get("/me", protectParent, getMe);

module.exports = router;
