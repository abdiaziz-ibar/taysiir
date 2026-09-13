const express = require("express");
const router = express.Router();
const {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
  deactivateAcademicYear,
  deleteAcademicYear,
} = require("../controllers/academicYearController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.get("/", getAcademicYears);
router.post("/", authorize("admin"), createAcademicYear);
router.put("/:id", authorize("admin"), updateAcademicYear);
router.put("/:id/activate", authorize("admin"), activateAcademicYear);
router.put("/:id/deactivate", authorize("admin"), deactivateAcademicYear);
router.delete("/:id", authorize("admin"), deleteAcademicYear);

module.exports = router;
