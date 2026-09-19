const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/parentPortalController");
const { protectParent } = require("../middleware/parentAuth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protectParent, getMe);

module.exports = router;
