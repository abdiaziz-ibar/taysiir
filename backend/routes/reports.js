const express = require("express");
const router = express.Router();
const {
  getDashboard,
  getMonthlyReport,
  getYearlyReport,
  getDebtsReport,
  getParentReport,
} = require("../controllers/reportController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/dashboard", getDashboard);
router.get("/monthly", getMonthlyReport);
router.get("/yearly", getYearlyReport);
router.get("/debts", getDebtsReport);
router.get("/parent/:id", getParentReport);

module.exports = router;
