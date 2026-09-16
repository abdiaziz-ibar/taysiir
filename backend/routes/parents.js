const express = require("express");
const router = express.Router();
const {
  getParents,
  getParentById,
  createParent,
  bulkImportParents,
  updateParent,
  deleteParent,
} = require("../controllers/parentController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.get("/", getParents);
router.post("/bulk-import", bulkImportParents);
router.get("/:id", getParentById);
router.post("/", createParent);
router.put("/:id", updateParent);
router.delete("/:id", authorize("admin"), deleteParent);

module.exports = router;
