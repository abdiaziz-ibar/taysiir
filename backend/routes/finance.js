const express = require("express");
const router = express.Router();
const { getFinanceSummary, getMonthOverview, getYearOverview } = require("../controllers/financeController");
const { protectFinance } = require("../middleware/financeAuth");

// Finance-section login only (not system users, not parents).
router.use(protectFinance);
router.get("/summary", getFinanceSummary);
router.get("/month", getMonthOverview);
router.get("/year", getYearOverview);

module.exports = router;
