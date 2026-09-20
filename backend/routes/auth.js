const express = require("express");
const router = express.Router();
const { login, getMe, verifyPassword, changePassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/verify-password", protect, verifyPassword);
router.post("/change-password", protect, changePassword);

module.exports = router;
