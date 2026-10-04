const express = require("express");
const router = express.Router();
const { getFinanceSummary } = require("../controllers/financeController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));
router.get("/summary", getFinanceSummary);

module.exports = router;
