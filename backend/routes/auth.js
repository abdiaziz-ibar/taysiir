const express = require("express");
const router = express.Router();
const { login, getMe, verifyPassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/verify-password", protect, verifyPassword);

module.exports = router;
