const express = require("express");
const router = express.Router();
const { login, getMe, verifyPassword, changePassword } = require("../controllers/financeAuthController");
const { protectFinance } = require("../middleware/financeAuth");

router.post("/login", login);
router.get("/me", protectFinance, getMe);
router.post("/verify-password", protectFinance, verifyPassword);
router.post("/change-password", protectFinance, changePassword);

module.exports = router;
