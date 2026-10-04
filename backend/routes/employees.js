const express = require("express");
const router = express.Router();
const { getEmployees, createEmployee, updateEmployee, deleteEmployee } = require("../controllers/employeeController");
const { protect, authorize } = require("../middleware/auth");

// Payroll data is sensitive: admins only.
router.use(protect, authorize("admin"));
router.get("/", getEmployees);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;
