const express = require("express");
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require("../controllers/expenseCategoryController");
const { protectFinance } = require("../middleware/financeAuth");

// Finance-section login only.
router.use(protectFinance);
router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
