const express = require("express");
const router = express.Router();
const { getSalarySummary, createSalaryPayment, updateSalaryPayment, deleteSalaryPayment } = require("../controllers/salaryController");
const { protectFinance } = require("../middleware/financeAuth");

// Finance-section login only (not system users, not parents).
router.use(protectFinance);
router.get("/summary", getSalarySummary);
router.post("/", createSalaryPayment);
router.put("/:id", updateSalaryPayment);
router.delete("/:id", deleteSalaryPayment);

module.exports = router;
