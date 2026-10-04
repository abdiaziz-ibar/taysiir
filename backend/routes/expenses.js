const express = require("express");
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense } = require("../controllers/expenseController");
const { protectFinance } = require("../middleware/financeAuth");

// Finance-section login only (not system users, not parents).
router.use(protectFinance);
router.get("/", getExpenses);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
