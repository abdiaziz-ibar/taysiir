const express = require("express");
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense, updateRecurring, stopRecurring, repeatMonth } = require("../controllers/expenseController");
const { protectFinance } = require("../middleware/financeAuth");

// Finance-section login only (not system users, not parents).
router.use(protectFinance);
router.get("/", getExpenses);
router.post("/", createExpense);
// Monthly (recurring) entries — declared before "/:id" so "recurring" isn't read as an id.
router.post("/recurring/from-month", repeatMonth);
router.put("/recurring/:id", updateRecurring);
router.delete("/recurring/:id", stopRecurring);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
