const express = require("express");
const router = express.Router();
const { getEmployees, createEmployee, updateEmployee, deleteEmployee } = require("../controllers/employeeController");
const { protectFinance } = require("../middleware/financeAuth");

// Finance-section login only (not system users, not parents).
router.use(protectFinance);
router.get("/", getEmployees);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;
