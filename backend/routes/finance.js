const express = require("express");
const router = express.Router();
const { getFinanceSummary } = require("../controllers/financeController");
const { protectFinance } = require("../middleware/financeAuth");

// Finance-section login only (not system users, not parents).
router.use(protectFinance);
router.get("/summary", getFinanceSummary);

module.exports = router;
