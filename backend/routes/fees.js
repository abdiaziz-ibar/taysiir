const express = require("express");
const router = express.Router();
const { getFees, getFeeById, createFee, updateFee } = require("../controllers/feeController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getFees);
router.get("/:id", getFeeById);
router.post("/", createFee);
router.put("/:id", updateFee);

module.exports = router;
