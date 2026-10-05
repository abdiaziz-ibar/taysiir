const express = require("express");
const router = express.Router();
const { getFinanceSummary, getMonthOverview } = require("../controllers/financeController");
const { protectFinance } = require("../middleware/financeAuth");

// Finance-section login only (not system users, not parents).
router.use(protectFinance);
router.get("/summary", getFinanceSummary);
router.get("/month", getMonthOverview);

module.exports = router;
