const express = require("express");
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
} = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.get("/", getPayments);
router.get("/:id", getPaymentById);
router.post("/", createPayment);
router.put("/:id", updatePayment);
router.delete("/:id", authorize("admin"), deletePayment);

module.exports = router;
