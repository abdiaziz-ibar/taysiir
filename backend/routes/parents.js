const express = require("express");
const router = express.Router();
const {
  getParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
} = require("../controllers/parentController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.get("/", getParents);
router.get("/:id", getParentById);
router.post("/", createParent);
router.put("/:id", updateParent);
router.delete("/:id", authorize("admin"), deleteParent);

module.exports = router;
