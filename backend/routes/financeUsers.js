const express = require("express");
const router = express.Router();
const { getFinanceUsers, createFinanceUser, updateFinanceUser, deleteFinanceUser } = require("../controllers/financeUserController");
const { protect, authorize } = require("../middleware/auth");

// The system admin manages finance logins (it can't read finance data with them).
router.use(protect, authorize("admin"));
router.get("/", getFinanceUsers);
router.post("/", createFinanceUser);
router.put("/:id", updateFinanceUser);
router.delete("/:id", deleteFinanceUser);

module.exports = router;
