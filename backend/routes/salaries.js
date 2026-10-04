const express = require("express");
const router = express.Router();
const { getSalarySummary, createSalaryPayment, updateSalaryPayment, deleteSalaryPayment } = require("../controllers/salaryController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));
router.get("/summary", getSalarySummary);
router.post("/", createSalaryPayment);
router.put("/:id", updateSalaryPayment);
router.delete("/:id", deleteSalaryPayment);

module.exports = router;
