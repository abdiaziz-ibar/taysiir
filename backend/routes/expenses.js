const express = require("express");
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense } = require("../controllers/expenseController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));
router.get("/", getExpenses);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
